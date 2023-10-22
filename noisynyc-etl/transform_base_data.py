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
					filename='./logs/transform_base_data_' + log_file_suffix + '.log')
logging.info ('Starting')


try:
    try:
        complaintsDatabaseFile = 'complaints.db'
        db = sqlite3.connect(complaintsDatabaseFile, factory=sqlite3.Connection)
        logging.info ('Connection to complaints DB successful')
    except:
        logging.error ('Problem connecting to complaints database')


    location_types = ['BOROUGH','COMMUNITY_BOARD','ZIP5']

    # +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
    # BASE DATA FOR SUMMARY  

    logging.info ('Starting base data for summary')

    location_data = {}

    for location_type in location_types:
        logging.info ('Starting location type: ' + location_type)

        if location_type == 'ZIP5':
            lt_query_string = 'INCIDENT_ZIP'
        else:
            lt_query_string = location_type
        
        cursor = db.cursor()
        cursor.execute(f'''  
            
    WITH BASE_DATA AS
        (
            SELECT		C.borough

                    ,UNIQUE_KEY
                    ,CASE WHEN D.TRAILING_QUARTERS BETWEEN 1 AND 12 THEN 1 ELSE 0 END AS FLAG_3YEAR
                    ,CASE WHEN D.TRAILING_MONTHS   BETWEEN 1 AND 12 THEN 1 ELSE 0 END AS FLAG_12MONTH
                    ,CASE WHEN D.TRAILING_DAYS     BETWEEN 1 AND 30 THEN 1 ELSE 0 END AS FLAG_30DAYS
                            
            FROM		COMPLAINT_DATA_RAW C
                        INNER JOIN DATE_MAP D ON C.CREATED_DATE = D.CALCULATED_DATE
            WHERE		UPPER (C.{lt_query_string}) NOT LIKE '%SPECIFIED%'
            AND		LENGTH (C.{lt_query_string}) > 0
            AND		D.TRAILING_YEARS BETWEEN 0 AND 3
        ),
        SUMMARIZED_DATA AS (
            SELECT	 {lt_query_string}
                    ,COUNT (CASE WHEN FLAG_3YEAR   = 1 THEN UNIQUE_KEY ELSE NULL END) AS COUNT_LOC_3YEAR
                    ,COUNT (CASE WHEN FLAG_12MONTH = 1 THEN UNIQUE_KEY ELSE NULL END) AS COUNT_LOC_12MONTH
                    ,COUNT (CASE WHEN FLAG_30DAYS  = 1 THEN UNIQUE_KEY ELSE NULL END) AS COUNT_LOC_30DAYS   
            FROM		BASE_DATA
            GROUP BY 	{lt_query_string}	
                            
        ),
        PERIODS AS (
            SELECT		DISTINCT
                        '3YEAR' AS PERIOD_TYPE
                    ,CALCULATED_DATE
                    ,CALCULATED_QUARTER AS CALCULATED_PERIOD
            FROM		DATE_MAP
            WHERE		TRAILING_QUARTERS BETWEEN 1 AND 12

            UNION ALL
            
            SELECT		DISTINCT
                        '12MONTH' AS PERIOD_TYPE
                    ,CALCULATED_DATE
                    ,CALCULATED_MONTH AS CALCULATED_PERIOD
            FROM		DATE_MAP	
            WHERE		TRAILING_MONTHS BETWEEN 1 AND 12

            UNION ALL
            
            SELECT		DISTINCT
                        '30DAY' AS PERIOD_TYPE
                    ,CALCULATED_DATE
                    ,CALCULATED_DATE AS CALCULATED_PERIOD
            FROM		DATE_MAP	
            WHERE		TRAILING_DAYS BETWEEN 1 AND 30
        ),
        LOCATIONS AS (
            SELECT		DISTINCT		
                        {lt_query_string} AS LOCATION_TYPE
            FROM		COMPLAINT_DATA_RAW
            WHERE		LENGTH ({lt_query_string}) > 0
        ),
        COMBINATIONS AS (
            SELECT		*
            FROM		PERIODS M
                        CROSS JOIN LOCATIONS L
        ),
        PERIOD_DETAIL AS (

        SELECT		PERIOD_TYPE
                ,LOCATION_TYPE
                ,GROUP_CONCAT (COMPLAINT_COUNT) AS COMPLAINT_DETAIL
                
        FROM		(

            SELECT	 D.PERIOD_TYPE
                    ,D.CALCULATED_PERIOD
                    ,D.LOCATION_TYPE
                    ,SUM (CASE WHEN C.UNIQUE_KEY IS NOT NULL THEN 1 ELSE 0 END) AS COMPLAINT_COUNT
            FROM	 COMBINATIONS D
                    LEFT JOIN COMPLAINT_DATA_RAW C ON D.CALCULATED_DATE = C.CREATED_DATE AND D.LOCATION_TYPE = C.{lt_query_string}

            GROUP BY D.PERIOD_TYPE
                    ,D.CALCULATED_PERIOD
                    ,D.LOCATION_TYPE

            ORDER BY 	1,3,2
                )

        GROUP BY	PERIOD_TYPE
                ,LOCATION_TYPE
        )
                        
                        

        SELECT	 {lt_query_string}
                ,COUNT_LOC_3YEAR
                ,COUNT_LOC_12MONTH
                ,COUNT_LOC_30DAYS
                ,IFNULL (ROUND (CAST (COUNT_LOC_3YEAR AS REAL)   / (SUM (COUNT_LOC_3YEAR) OVER ()),4),0)   AS COUNT_PCT_3YEAR
                ,IFNULL (ROUND (CAST (COUNT_LOC_12MONTH AS REAL) / (SUM (COUNT_LOC_12MONTH) OVER ()),4),0) AS COUNT_PCT_12MONTH
                ,IFNULL (ROUND (CAST (COUNT_LOC_30DAYS AS REAL)  / (SUM (COUNT_LOC_30DAYS) OVER ()),4),0)  AS COUNT_PCT_30DAYS
                        
                ,RANK () OVER (ORDER BY COUNT_LOC_3YEAR DESC)   AS COUNT_RNK_3YEAR
                ,RANK () OVER (ORDER BY COUNT_LOC_12MONTH DESC) AS COUNT_RNK_12MONTH
                ,RANK () OVER (ORDER BY COUNT_LOC_30DAYS DESC)  AS COUNT_RNK_30DAYS	   
                ,DY.COMPLAINT_DETAIL AS COMPLAINT_DETAIL_3YEAR
                ,DM.COMPLAINT_DETAIL AS COMPLAINT_DETAIL_12MONTH
                ,DD.COMPLAINT_DETAIL AS COMPLAINT_DETAIL_30DAY
                
        FROM	 SUMMARIZED_DATA S
                LEFT JOIN PERIOD_DETAIL DY ON DY.PERIOD_TYPE = '3YEAR'   AND S.{lt_query_string} = DY.LOCATION_TYPE 
                LEFT JOIN PERIOD_DETAIL DM ON DM.PERIOD_TYPE = '12MONTH' AND S.{lt_query_string} = DM.LOCATION_TYPE 
                LEFT JOIN PERIOD_DETAIL DD ON DD.PERIOD_TYPE = '30DAY'   AND S.{lt_query_string} = DD.LOCATION_TYPE 

        ORDER BY 	1

                
                    ''')
        rows = cursor.fetchall()
        cursor.close()
        logging.info ('Cursor completed successfully')

        complaint_location_values = []
        
        for row in rows:

            s_detail_3year   = row[10].split(",")
            s_detail_12month = row[11].split(",")
            s_detail_30day   = row[12].split(",")
            l_detail_3year   = [eval(i) for i in s_detail_3year]
            l_detail_12month = [eval(i) for i in s_detail_12month]
            l_detail_30day   = [eval(i) for i in s_detail_30day]

            complaint_data = {'location_value'    : row[0]
                            ,'count_3year'        : row[1]
                            ,'count_12month'      : row[2]
                            ,'count_30day'        : row[3]
                            ,'pct_tot_3year'      : row[4]
                            ,'pct_tot_12month'    : row[5]
                            ,'pct_tot_30day'      : row[6]      
                            ,'rank_3year'         : row[7]
                            ,'rank_12month'       : row[8]
                            ,'rank_30day'         : row[9]     
                            ,'detail_3year'       : l_detail_3year
                            ,'detail_12month'     : l_detail_12month 
                            ,'detail_30day'       : l_detail_30day          

            }


            complaint_location_values.append (complaint_data)

        location_data[location_type] = complaint_location_values

        logging.info ('Finishing location type: ' + location_type)
        

    base_data = {"borough"         : location_data['BOROUGH']
                ,"community_board" : location_data['COMMUNITY_BOARD']
                ,"zip5"            : location_data['ZIP5']
                }

    logging.info ('Writing base data')
    base_data_json = json.dumps(base_data)

    f = open('./output/base_data.json', 'w')
    f.write(str(base_data_json))
    f.close()
    
    logging.info ('Completed')



except:
    logging.warning('Unidentified error')



