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
					filename='./logs/transform_detail_json' + log_file_suffix + '.log')
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
    # JSON SUMMARIES BY LOCATION

    logging.info ('Starting JSON summaries by location')

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
                            ORDER BY 1''')

        rows = cursor.fetchall()
        for row in rows:
            location_values.append (row[0])
        logging.info ('Location values: ' + str(location_values))


        for location in location_values:
            logging.info (f'Location {location_type}: ' + location)

            cursor.execute(f'''  
            
            
            WITH ELIGIBLE_QUARTERS AS
            (
                SELECT		DISTINCT
                            CALCULATED_QUARTER
                FROM		DATE_MAP
                ORDER BY	1 DESC
                LIMIT 12
            ), COMPLAINT_DATA AS (
			
            SELECT	 COMPLAINT_TYPE
                    ,DESCRIPTOR
                    ,CALCULATED_QUARTER
                    ,COUNT (DISTINCT UNIQUE_KEY) AS COMPLAINT_COUNT

            FROM		COMPLAINT_DATA_RAW C
            
                        INNER JOIN DATE_MAP D ON C.CREATED_DATE = D.CALCULATED_DATE
                        
            WHERE	{lt_query_string}  = ?
            AND		D.CALCULATED_QUARTER IN (SELECT CALCULATED_QUARTER FROM ELIGIBLE_QUARTERS)
            
            GROUP BY	COMPLAINT_TYPE
                    ,DESCRIPTOR
                    ,CALCULATED_QUARTER
                    
            ORDER BY	COMPLAINT_TYPE
                    ,DESCRIPTOR
                    ,CALCULATED_QUARTER
					
			), COMBINATIONS AS (
			
			SELECT		DISTINCT
						C.COMPLAINT_TYPE
					   ,C.DESCRIPTOR
					   ,T.CALCULATED_QUARTER

			  FROM		COMPLAINT_DATA C
						CROSS JOIN ELIGIBLE_QUARTERS T
						
			
			)
			
            SELECT	 COMPLAINT_TYPE
                    ,DESCRIPTOR
                    ,GROUP_CONCAT (CALCULATED_QUARTER) AS COMPLAINT_QUARTER
                    ,GROUP_CONCAT (COMPLAINT_COUNT) AS COMPLAINT_DETAIL
                        
            FROM		(
                        
            SELECT		B.COMPLAINT_TYPE
                    ,B.DESCRIPTOR
                    ,B.CALCULATED_QUARTER
                    ,IFNULL (C.COMPLAINT_COUNT,0) AS COMPLAINT_COUNT
                    
            FROM		COMBINATIONS B
            
                        LEFT JOIN COMPLAINT_DATA C ON B.COMPLAINT_TYPE = C.COMPLAINT_TYPE
                                                    AND B.DESCRIPTOR = C.DESCRIPTOR
                                                    AND B.CALCULATED_QUARTER = C.CALCULATED_QUARTER
            ORDER BY	1,2,3

                        )
                        
            GROUP BY 	COMPLAINT_TYPE
                    ,DESCRIPTOR

                    
                        ''',[location])
            rows = cursor.fetchall()
            logging.info ('Cursor completed successfully')

            unique_complaint_type = []
            for row in rows:
                if row[0] not in unique_complaint_type:
                    unique_complaint_type.append(row[0])

            location_data = []

            # for each complaint type, create list with descriptors
            for i in unique_complaint_type:

                descriptor_list = []

                for j in rows: 
                    if j[0] == i:
                        t = {'descriptor'              : j[1]
                            ,'complaint_quarter'       : j[2]
                            ,'complaint_count'         : j[3]
                            }
                        descriptor_list.append(t)


                descriptor_record = {'complaint_data' : descriptor_list 
                                    ,'complaint_type' : i}

                location_data.append(descriptor_record)
            
  
            location_data_json = json.dumps(location_data)

 
            logging.info ('Writing JSON location data')

            file_name = location.lower().replace(' ','_')

            f = open('./output/detail_data_' + file_name + '.json', 'w')
            f.write(str(location_data_json))
            f.close()
    
    logging.info ('Completed')



except:
    logging.warning('Unidentified error')



