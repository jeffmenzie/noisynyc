import requests 
import json
import datetime
import sys
import getopt
import sqlite3
import logging
import os



# make sure log path exist
log_path = "logs"
log_path_exists = os.path.exists(log_path)
if not log_path_exists:
    os.makedirs(log_path)


# log file settings
log_file_suffix = datetime.datetime.now().strftime('%Y-%m-%d.%H_%M_%S')
logging.basicConfig(level=logging.INFO, 
					format='%(asctime)s %(levelname)-8s %(message)s',
					datefmt='%Y-%m-%d %H:%M:%S',
					filename='./logs/extract_' + log_file_suffix + '.log')
logging.info ('Starting')


try:
    historytype = None
    options, arguments = getopt.getopt(sys.argv[1:], 'h:', ['historytype='])
    # print (options, arguments)
    for option, argument in options:
        if option in ('--historytype','-h'):
            if argument not in ('full','partial'):
                logging.warning ('Argument historytype not valid')
                pass
            else:
                logging.info ('Argument historytype: ' + argument)
                historytype = argument

    if historytype == None:
        print ('Argument historytype missing. Exiting. Valid options are full or partial')
        logging.warning ('Argument historytype missing. Exiting. Valid options are full or partial')
        sys.exit

except:
	logging.error('Error setting options')
	exit() 


# database file settings
complaintsDatabaseFile = 'complaints.db'

# variable initiation
records_skipped = 0
records_imported = 0

# fetch data

#complaint_limit = str(100000)
complaint_limit = str(90000000)
current_date = datetime.datetime.now()
years_of_data = 3
query_select_fields = 'unique_key,created_date,complaint_type,descriptor,incident_zip,incident_address,borough,community_board,status,resolution_description,latitude,longitude'
if historytype == 'full':
    complaint_created_date = datetime.datetime (current_date.year - years_of_data, current_date.month - 3, 1).strftime('%Y-%m-%d')
    complaint_type_url = "https://data.cityofnewyork.us/api/id/erm2-nwe9.json?$query=select " + query_select_fields + ", :id where ((`created_date` > '" + complaint_created_date + "T00:00:00') and (contains(upper(`complaint_type`), upper('Noise')))) order by `created_date` desc limit " + complaint_limit
    logging.info ('Complaint source URL: ' + complaint_type_url)
    logging.info ('Complaint created date: ' + complaint_created_date)
elif historytype == 'partial':
    date_delta = datetime.timedelta(90)
    complaint_created_date = (current_date - date_delta).strftime('%Y-%m-%d')
    complaint_type_url = "https://data.cityofnewyork.us/api/id/erm2-nwe9.json?$query=select " + query_select_fields + ", :id where ((`created_date` > '" + complaint_created_date + "T00:00:00') and (contains(upper(`complaint_type`), upper('Noise')))) order by `created_date` desc limit " + complaint_limit
    logging.info ('Complaint source URL: ' + complaint_type_url)
    logging.info ('Complaint created date: ' + complaint_created_date)



try:
    request_headers = {'User-Agent': 'noisynyc.com bot'}
    complaint_type_raw = requests.get(complaint_type_url, headers=request_headers)
    complaint_type_json = json.loads(complaint_type_raw.text)
    logging.info('Request completed')
except:
	logging.error('Error completing request')
	exit() 


try:
    if historytype == 'full':
        if os.path.exists(complaintsDatabaseFile):
            logging.info('Prior version of DB file found, deleting')
            os.remove(complaintsDatabaseFile) 
        else: 
            logging.info('No prior version of DB file found, skipping delete')

        try:
            db = sqlite3.connect(complaintsDatabaseFile)
            cursor = db.cursor()

            logging.info('Create raw data table start')
            cursor.execute('''
                CREATE TABLE "COMPLAINT_DATA_RAW" (
                     "UNIQUE_KEY"		         INTEGER NOT NULL PRIMARY KEY UNIQUE
                    ,"CREATED_DATE"		         TEXT
                    ,"COMPLAINT_TYPE"	         TEXT
                    ,"DESCRIPTOR"		         TEXT
                    ,"INCIDENT_ZIP"		         TEXT
                    ,"BOROUGH"			         TEXT
                    ,"COMMUNITY_BOARD"	         TEXT
                    ,"INCIDENT_ADDRESS"	         TEXT
                    ,"STATUS"                    TEXT
                    ,"RESOLUTION_DESCRIPTION"    TEXT
                    ,"LATITUDE"			         TEXT
                    ,"LONGITUDE"		         TEXT
                    ,"DATE_INSERTED"             TEXT
                    ,"DATE_LAST_RECEIVED"        TEXT
                    ,"CREATED_AGE"               INTEGER
                );
            ''')
            db.commit()
            logging.info('Create raw data table complete')
        except:
            logging.warning('Unable to create raw table')


    logging.info('Inserting raw data')
    cursor_date = datetime.datetime.now().strftime('%Y-%m-%d.%H_%M_%S')
    
    db = sqlite3.connect(complaintsDatabaseFile)
    cursor = db.cursor()

    # make sure WAL is enabled
    logging.info('Running PRAGMA journal_mode = wal')
    cursor.execute(''' PRAGMA journal_mode = wal; ''')



    for i in complaint_type_json:


        try:
            unique_key     = i["unique_key"]
            created_date   = i["created_date"]
            complaint_type = i["complaint_type"]		
        except:
            records_skipped += 1
            print (i)

            continue

        try:
            descriptor              = i["descriptor"]
        except:
            descriptor              = ""		
        try:
            incident_zip            = i["incident_zip"]
        except:
            incident_zip            = "" 
        try:
            incident_address        = i["incident_address"]
        except:
            incident_address        = ""
        try:
            borough 		        = i["borough"]
        except:
            borough 		        = ""		
        try:
            community_board         = i["community_board"]
        except:
            community_board         = ""	

        try:
            status                  = i["status"]
        except:
            status                  = ""	
        try:
            resolution_description  = i["resolution_description"]
        except:
            resolution_description  = ""	

        try:
            latitude                = i["latitude"]
            longitude	            = i["longitude"]	
        except:
            latitude                = ""
            longitude	            = ""

        cursor.execute('''INSERT INTO COMPLAINT_DATA_RAW 
                                                    (UNIQUE_KEY 
                                                    ,CREATED_DATE
                                                    ,COMPLAINT_TYPE
                                                    ,DESCRIPTOR
                                                    ,INCIDENT_ZIP
                                                    ,INCIDENT_ADDRESS
                                                    ,BOROUGH
                                                    ,COMMUNITY_BOARD
                                                    ,STATUS
                                                    ,RESOLUTION_DESCRIPTION
                                                    ,LATITUDE
                                                    ,LONGITUDE
                                                    ,DATE_INSERTED
                                                    )
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT (UNIQUE_KEY) DO UPDATE SET DATE_LAST_RECEIVED = ?''',
                                                (unique_key,  
                                                created_date,
                                                complaint_type,
                                                descriptor,
                                                incident_zip,
                                                incident_address,
                                                borough,
                                                community_board,
                                                status,
                                                resolution_description,
                                                latitude,
                                                longitude,
                                                cursor_date,
                                                cursor_date
                                                	                   
                                                    ) )
        records_imported +=1

    db.commit()


    logging.info("Records skipped:  " + str(records_skipped))
    logging.info("Records imported: " + str(records_imported))

    # truncate date and time to date only
    logging.info("Preparing to update CREATED_DATE")
    cursor.execute(''' UPDATE COMPLAINT_DATA_RAW 
		               SET CREATED_DATE = SUBSTR (CREATED_DATE, 1, 10); ''')	
    db.commit()
    logging.info("Completed updating CREATED_DATE")

    # insure ZIP is ZIP5
    logging.info("Preparing to update INCIDENT_ZIP")
    cursor.execute(''' UPDATE COMPLAINT_DATA_RAW 
		               SET INCIDENT_ZIP = SUBSTR (INCIDENT_ZIP, 1, 5); ''')	
    db.commit()
    logging.info("Completed updating INCIDENT_ZIP")

    # update entry age
    logging.info("Preparing to update CREATED_AGE")
    cursor.execute(''' UPDATE COMPLAINT_DATA_RAW 
		               SET CREATED_AGE = CAST (JULIANDAY('NOW','LOCALTIME','START OF DAY') - JULIANDAY(CREATED_DATE) AS INT); ''')	

    db.commit()
    logging.info("Completed updating CREATED_AGE")

    # update index
    logging.info("Preparing to recreate index IDX_PK_COMPLAINT_DATA")
    cursor.execute('''DROP INDEX IF EXISTS IDX_PK_COMPLAINT_DATA; ''')	
    cursor.execute('''CREATE UNIQUE INDEX IDX_PK_COMPLAINT_DATA ON COMPLAINT_DATA_RAW (UNIQUE_KEY); ''')	

    logging.info("Preparing to recreate index IDX_CD_ZIP")
    cursor.execute('''DROP INDEX IF EXISTS IDX_CD_ZIP; ''')	
    cursor.execute('''CREATE INDEX IDX_CD_ZIP ON COMPLAINT_DATA_RAW (INCIDENT_ZIP); ''')	

    logging.info("Preparing to recreate index IDX_CD_COMMUNITY_BOARD")
    cursor.execute('''DROP INDEX IF EXISTS IDX_CD_COMMUNITY_BOARD; ''')	
    cursor.execute('''CREATE INDEX IDX_CD_COMMUNITY_BOARD ON COMPLAINT_DATA_RAW (COMMUNITY_BOARD); ''')	

    logging.info("Preparing to recreate index IDX_CD_CREATED_DATE")
    cursor.execute('''DROP INDEX IF EXISTS IDX_CD_CREATED_DATE; ''')	
    cursor.execute('''CREATE INDEX IDX_CD_CREATED_DATE ON COMPLAINT_DATA_RAW (CREATED_DATE); ''')	


    # create and update date_map table
    logging.info("Dropping DATE_MAP table")
    cursor.execute(''' DROP TABLE IF EXISTS DATE_MAP; ''')	

    db.commit()

    logging.info("Creating DATE_MAP table")
    cursor.execute(''' CREATE TABLE DATE_MAP AS
                       WITH INC_TABLE AS
                       (
                            SELECT		0 AS INC_VALUE
                            UNION	
                            SELECT		INC_VALUE +1
                            FROM		INC_TABLE
                            WHERE		INC_VALUE < 1500
                       )
                       SELECT	I.*
                               ,STRFTIME('%Y',CALCULATED_DATE_JULIAN) AS CALCULATED_YEAR
                               ,SUBSTR (STRFTIME('%Y',CALCULATED_DATE_JULIAN),3,2) || '/' || STRFTIME('%m',CALCULATED_DATE_JULIAN) AS CALCULATED_MONTH
                               ,SUBSTR (STRFTIME('%Y',CALCULATED_DATE_JULIAN),3,2) || '/' || 'Q' || ((STRFTIME('%m', CALCULATED_DATE_JULIAN) + 2) / 3) AS CALCULATED_QUARTER 
                               ,STRFTIME('%Y',CURRENT_DATE_JULIAN) - STRFTIME('%Y',CALCULATED_DATE_JULIAN) AS TRAILING_YEARS
                               ,((STRFTIME('%Y',CURRENT_DATE_JULIAN) - STRFTIME('%Y',CALCULATED_DATE_JULIAN)) * 12) + 
                                STRFTIME('%m',CURRENT_DATE_JULIAN) - STRFTIME('%m',CALCULATED_DATE_JULIAN) AS TRAILING_MONTHS
                         FROM	(
                                 SELECT		DATE ('NOW','LOCALTIME','-' || INC_VALUE || ' DAYS') AS CALCULATED_DATE
                                           ,INC_VALUE AS TRAILING_DAYS
                                           ,JULIANDAY ('NOW','LOCALTIME','START OF DAY') AS CURRENT_DATE_JULIAN
                                           ,JULIANDAY ('NOW','LOCALTIME','-' || INC_VALUE || ' DAYS', 'START OF DAY') AS CALCULATED_DATE_JULIAN 
                                   FROM		INC_TABLE
                                ) I ; ''')
    db.commit()

    logging.info("Creating IDX_DATE_MAP index on DATE_MAP")
    cursor.execute(''' CREATE UNIQUE INDEX "IDX_DATE_MAP" ON "DATE_MAP" ("CALCULATED_DATE"); ''')


    # +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
    # Rebuild BYADDRESS_SUMMARY_DATA

    logging.info("Dropping BYADDRESS_SUMMARY_DATA table")
    cursor.execute(''' DROP TABLE IF EXISTS BYADDRESS_SUMMARY_DATA; ''')	

    db.commit()

    logging.info("Creating BYADDRESS_SUMMARY_DATA table")
    cursor.execute(''' CREATE TABLE BYADDRESS_SUMMARY_DATA AS
                        SELECT	    COMPLAINT_TYPE
                                   ,DESCRIPTOR
                                   ,ROUND (LATITUDE,6) AS LATITUDE
                                   ,ROUND (LONGITUDE,6) AS LONGITUDE
                                   ,SUM (CASE WHEN CREATED_AGE < 7    THEN 1 ELSE 0 END) AS COMPLAINTS_DAYS_7
                                   ,SUM (CASE WHEN CREATED_AGE < 30   THEN 1 ELSE 0 END) AS COMPLAINTS_DAYS_30
                                   ,SUM (CASE WHEN CREATED_AGE < 365  THEN 1 ELSE 0 END) AS COMPLAINTS_YEARS_1
                                   ,SUM (CASE WHEN CREATED_AGE < 1095 THEN 1 ELSE 0 END) AS COMPLAINTS_YEARS_3   
                          FROM	    COMPLAINT_DATA_RAW
                         WHERE	    CREATED_AGE <= 1095 -- 3 YEARS
                           AND	    LATITUDE != 0
                        GROUP BY 	COMPLAINT_TYPE
                                   ,DESCRIPTOR
                                   ,ROUND (LATITUDE,6) 
                                   ,ROUND (LONGITUDE,6) ''')
    db.commit()
    logging.info("Finished creating BYADDRESS_SUMMARY_DATA table")


    # run Optimize
    logging.info('Running PRAGMA optimize')
    cursor.execute(''' PRAGMA optimize; ''')


    logging.info('Finished')
    db.close()


except:
    logging.warning('Unidentified error')
    pass


















