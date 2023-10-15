import sqlite3
import logging
import datetime
import os
from pathlib import Path
from geojson import Feature, Point, FeatureCollection



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
					filename='./logs/transform_map_data_' + log_file_suffix + '.log')
logging.info ('Starting')


try:
    complaintsDatabaseFile = 'complaints.db'
    db = sqlite3.connect(complaintsDatabaseFile, factory=sqlite3.Connection)
    cursor = db.cursor()


    logging.info("Dropping HEATMAP_DATA table")
    cursor.execute(''' DROP TABLE IF EXISTS HEATMAP_DATA; ''')	


    # create heatmap data
    logging.info('Creating heatmap data')
    cursor.execute('''
            CREATE TABLE HEATMAP_DATA AS
            WITH PERIODS AS (
                SELECT		DISTINCT
                            '12MONTH' AS PERIOD_TYPE
                            ,CALCULATED_DATE
                            ,CALCULATED_MONTH AS CALCULATED_PERIOD
                FROM		DATE_MAP	
                WHERE		TRAILING_MONTHS BETWEEN 0 AND 11

                UNION ALL
                
                SELECT		DISTINCT
                            '30DAY' AS PERIOD_TYPE
                        ,CALCULATED_DATE
                        ,CALCULATED_DATE AS CALCULATED_PERIOD
                FROM		DATE_MAP	
                WHERE		TRAILING_DAYS BETWEEN 0 AND 29
            )

            SELECT		COUNT (DISTINCT REPLACE(SUBSTR(CREATED_DATE,1,10), '_' , '-')) AS COMPLAINTS
                        ,ROUND (CAST (LATITUDE AS REAL),5) AS LATITUDE
                        ,ROUND (CAST (LONGITUDE AS REAL),5) AS LONGITUDE
                        ,FIRST_VALUE (INCIDENT_ADDRESS) OVER (PARTITION BY ROUND (CAST (LATITUDE AS REAL),5), ROUND (CAST (LONGITUDE AS REAL),5) ORDER BY COUNT (DISTINCT REPLACE(SUBSTR(CREATED_DATE,1,10), '_' , '-')) DESC) AS MOST_COMMON_ADDRESS
                        ,'M' AS COMPLAINT_PERIOD
            FROM 	    COMPLAINT_DATA_RAW C
                        INNER JOIN PERIODS P ON P.CALCULATED_DATE = C.CREATED_DATE AND P.PERIOD_TYPE = '30DAY'
            WHERE 	    CAST (LATITUDE AS REAL) <> 0
              AND 	    CAST (LONGITUDE AS REAL) <> 0
            GROUP BY 	ROUND (CAST (LATITUDE AS REAL),5) 
                        ,ROUND (CAST (LONGITUDE AS REAL),5) 
                        
            UNION ALL

            SELECT		COUNT (DISTINCT REPLACE(SUBSTR(CREATED_DATE,1,10), '_' , '-')) AS COMPLAINTS
                        ,ROUND (CAST (LATITUDE AS REAL),5) AS LATITUDE
                        ,ROUND (CAST (LONGITUDE AS REAL),5) AS LONGITUDE
                        ,FIRST_VALUE (INCIDENT_ADDRESS) OVER (PARTITION BY ROUND (CAST (LATITUDE AS REAL),5), ROUND (CAST (LONGITUDE AS REAL),5) ORDER BY COUNT (DISTINCT REPLACE(SUBSTR(CREATED_DATE,1,10), '_' , '-')) DESC) AS MOST_COMMON_ADDRESS
                        ,'Y' AS COMPLAINT_PERIOD
            FROM 	    COMPLAINT_DATA_RAW C
                        INNER JOIN PERIODS P ON P.CALCULATED_DATE = C.CREATED_DATE AND P.PERIOD_TYPE = '12MONTH'
            WHERE 	    CAST (LATITUDE AS REAL) <> 0
              AND 	    CAST (LONGITUDE AS REAL) <> 0
            GROUP BY 	ROUND (CAST (LATITUDE AS REAL),5) 
                        ,ROUND (CAST (LONGITUDE AS REAL),5) 
    ''')
    db.commit()

    logging.info("Dropping IDX_HEATMAP index")
    cursor.execute(''' DROP INDEX IF EXISTS IDX_HEATMAP; ''')	


    logging.info('Creating heatmap index')
    cursor.execute('''
        CREATE UNIQUE INDEX "IDX_HEATMAP" ON "HEATMAP_DATA" (
            "COMPLAINT_PERIOD" ASC,
            "LATITUDE" ASC,
            "LONGITUDE"	ASC
        );
    ''')
    db.commit()


    logging.info('Creating heatmap extract for Month')
    cursor.execute('''select longitude, latitude, complaints from heatmap_data where complaint_period = 'M' ''')
    records = cursor.fetchall()
    pointsArray = []

    for row in records:
        points = Feature(geometry=Point((row[0], row[1])))
        pointsArray.append(points)

    geoJsonFeatureCollection = FeatureCollection(pointsArray)

    for idx, row in enumerate(records):
        geoJsonFeatureCollection[idx]['properties']['complaints'] = row[2]


    f = open('./output/complaints_m.geojson', 'w')
    f.write(str(geoJsonFeatureCollection))
    f.close()


    logging.info('Creating heatmap extract for Year')
    cursor.execute('''select longitude, latitude, complaints from heatmap_data where complaint_period = 'Y' ''')
    records = cursor.fetchall()
    pointsArray = []

    for row in records:
        points = Feature(geometry=Point((row[0], row[1])))
        pointsArray.append(points)

    geoJsonFeatureCollection = FeatureCollection(pointsArray)

    for idx, row in enumerate(records):
        geoJsonFeatureCollection[idx]['properties']['complaints'] = row[2]

    f = open('./output/complaints_y.geojson', 'w')
    f.write(str(geoJsonFeatureCollection))
    f.close()

    logging.info('Finished')

except:
    logging.error('Error creating heatmap files')
