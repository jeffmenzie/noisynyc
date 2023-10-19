import json
import datetime
import sqlite3
import logging
import os
import pandas as pd

# make sure log path exist
log_path = "logs"
log_path_exists = os.path.exists(log_path)
if not log_path_exists:
    os.makedirs(log_path)

# make sure output path exist
output_path = "output"
output_path_exists = os.path.exists(output_path)
if not output_path_exists:
    os.makedirs(output_path)


# log file settings
log_file_suffix = datetime.datetime.now().strftime('%Y-%m-%d.%H_%M_%S')
logging.basicConfig(level=logging.INFO, 
					format='%(asctime)s %(levelname)-8s %(message)s',
					datefmt='%Y-%m-%d %H:%M:%S',
					filename='./logs/transform_detail_extracts_' + log_file_suffix + '.log')
logging.info ('Starting')


try:
    try:
        complaintsDatabaseFile = 'complaints.db'
        db = sqlite3.connect(complaintsDatabaseFile, factory=sqlite3.Connection)
        cursor = db.cursor()
        logging.info ('Connection to complaints DB successful')
    except:
        logging.error ('Problem connecting to complaints database')


    location_types = ['BOROUGH','COMMUNITY_BOARD','ZIP5']

    # +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
    # EXCEL DETAIL EXTRACTS BY LOCATION 

    logging.info ('Starting Excel detail extracts by location')

    for location_type in location_types:

        if location_type == 'ZIP5':
            lt_query_string = 'INCIDENT_ZIP'
        else:
            lt_query_string = location_type

        location_values = []
        cursor.execute(f'''SELECT	DISTINCT {lt_query_string} 
                            FROM 	COMPLAINT_DATA_RAW
                            WHERE	UPPER ({lt_query_string}) NOT LIKE '%UNSPECIFIED%' 
                            AND	LENGTH ({lt_query_string}) > 0 
                            ORDER BY 1 ''')

        rows = cursor.fetchall()
        for row in rows:
            location_values.append (row[0])
        logging.info ('Location values: ' + str(location_values))

        for location in location_values:
            logging.info (f'Location {location_type}: ' + location)
            cursor.execute(f''' SELECT   UNIQUE_KEY
                                        ,CREATED_DATE
                                        ,COMPLAINT_TYPE
                                        ,DESCRIPTOR
                                        ,INCIDENT_ZIP
                                        ,INCIDENT_ADDRESS
                                        ,BOROUGH
                                        ,COMMUNITY_BOARD
                                        ,STATUS
                                        ,RESOLUTION_DESCRIPTION 
                                FROM     COMPLAINT_DATA_RAW                                 
                                WHERE	 CREATED_AGE >= 1 AND CREATED_AGE <= 1825 
                                  AND 	{lt_query_string} = ?
                                ORDER BY CREATED_AGE
                                            ''', [location])
            rows = cursor.fetchall()

            df = pd.DataFrame(rows)
            df.columns =['Unique Key'
                        ,'Created Date'
                        ,'Complaint Type'
                        ,'Complaint Descriptor'
                        ,'ZIP5'
                        ,'Address'
                        ,'Borough'
                        ,'Community Board'
                        ,'Status'
                        ,'Resolution']

            df['ZIP5'] = df['ZIP5'].astype('string')        
            df['Created Date'] = pd.to_datetime(df['Created Date']).dt.strftime('%m/%d/%Y')    
            file_name =  f'./output/{location_type}_{location}.xlsx'.replace(' ','_')
            try:
                df.to_excel(file_name, index=False, engine='xlsxwriter')
            except Exception as error:
                logging.error (error)
    
    logging.info ('Completed')


except:
    logging.warning('Unidentified error')



