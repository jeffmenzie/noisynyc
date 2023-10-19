import flask
import sqlite3
from flask import request, jsonify, send_file, make_response
import pandas as pd
import datetime
import os
from flask_cors import CORS
import logging

# make sure output path exist
output_path = "address_output"
output_path_exists = os.path.exists(output_path)
if not output_path_exists:
    os.makedirs(output_path)

# make sure log path exist
log_path = "logs"
log_path_exists = os.path.exists(log_path)
if not log_path_exists:
    os.makedirs(log_path)


# log file settings
logging.basicConfig(level=logging.INFO, 
					format='%(asctime)s %(levelname)-8s %(message)s',
					datefmt='%Y-%m-%d %H:%M:%S',
					filename='./logs/backend_api.log')
logging.info ('Starting')


dbFileName = '../noisynyc-etl/complaints.db'

app = flask.Flask(__name__)
CORS(app)


@app.route('/', methods=['GET'])
def home():
    return ("Error", 500)


@app.route('/api/healthcheck', methods=['GET'])
def healthCheck():
    try:
        response = jsonify( {'status': 'ok' })
        response.headers.add('Cache-Control', 'private, max-age=300, must-revalidate')
        return response 
    except Exception as error:
        logging.error(error)
        return ("Error", 500)


@app.route('/api/dbstatus', methods=['GET'])
def dbStatus():
    try:
        db = sqlite3.connect(dbFileName)
        cursor = db.cursor()
        cursor.execute('''select         count (1) as total_records
                                        ,max (created_date) as max_created_date
                                        ,max (date_inserted) as max_date_inserted
                                        ,max (created_age) as max_created_age
                                        ,min (created_age) as min_created_age
                            from        complaint_data_raw
                        ''')
        c = cursor.fetchall()
        db.close()
        t = {'total_record'       : c[0][0]
            ,'max_created_date'   : c[0][1]
            ,'max_date_inserted'  : c[0][2]
            ,'max_created_age'    : c[0][3]
            ,'min_created_age'    : c[0][4]
            }
        response = jsonify(t)
        response.headers.add('Cache-Control', 'private, max-age=300, must-revalidate')
        return response
    except Exception as error:
        logging.error(error)
        return ("Error", 500)


# when a user clicks on a location in the heatmap, return address details
@app.route('/api/heatmaplocationdetail', methods=['GET'])
def heatmapLocationDetail():
    try:
        latitude = request.args.get('latitude', type=float)
        longitude = request.args.get('longitude', type=float)
        period = request.args.get('period')
        db = sqlite3.connect(dbFileName)
        cursor = db.cursor()
        cursor.execute('''select        complaints
                                       ,most_common_address 
                            from        heatmap_data
                           where        complaint_period = ?
                             and        latitude = ?
                             and        longitude = ?
                        '''
                        , (period, latitude, longitude))
        c = cursor.fetchall()
        db.close()
        response = make_response(jsonify(c))
        response.headers.add('Cache-Control', 'private, max-age=300, must-revalidate')
        return response
    except Exception as error:
        logging.error(error)
        return ("Error", 500)


# data to populate by-address summary
@app.route('/api/byaddresssummary', methods=['GET'])
def byaddresssummary():
    try:
        latitude = request.args.get('latitude', type=float)
        longitude = request.args.get('longitude', type=float)
        distance = request.args.get('distance', type=int)

        if (distance > 2000):
            return ("Invalid argument", 500)
        
        db = sqlite3.connect(dbFileName)
        cursor = db.cursor()
        cursor.execute(''' with base as (
                                select		d.*
                                        -- multiply by 3.280839895 to convert to feet
                                        ,(2 * 6371 * asin(sqrt(0.5 - cos((latitude - ? )*(pi()/180))/2 + cos(? * (pi()/180)) * 
                                            cos(latitude*(pi()/180)) * (1-cos((longitude-(?))*(pi()/180)))/2)) * 1000) * 3.280839895 as distance_value_feet     
                                from		byaddress_summary_data d
                                        )
                                        
                            select	     complaint_type
                                        ,descriptor
                                        ,sum (complaints_days_30) as complaints_days_30
                                        ,sum (complaints_years_1) as complaints_years_1
                                        ,sum (complaints_years_3) as complaints_years_3                                                
                              from		 base
                             where		 distance_value_feet <= ? 
                            group by	 complaint_type
                                        ,descriptor 
                            order by     complaint_type
                                        ,descriptor 
		    '''
                        , (latitude, latitude, longitude, distance))
        c = cursor.fetchall()
        db.close()

        # create list of unique complaints
        unique_complaint_type = []
        for i in c:
            if i[0] not in unique_complaint_type:
                unique_complaint_type.append(i[0])

        response = []

        # for each complaint type, create list with descriptors
        for i in unique_complaint_type:

            descriptor_list = []

            for j in c: 
                if j[0] == i:
                    t = {'descriptor'              : j[1]
                        ,'complaints_days_30'      : j[2]
                        ,'complaints_years_1'      : j[3]
                        ,'complaints_years_3'      : j[4]
                        }
                    descriptor_list.append(t)


            descriptor_record = {'complaint_data' : descriptor_list 
                                ,'complaint_type' : i
                                }

            response.append(descriptor_record)
        
        response_json = jsonify(response)
        response_json.headers.add('Cache-Control', 'private, max-age=300, must-revalidate')
        return response_json

    except Exception as error:
        logging.error(error)
        return ("Error", 500)


# export data for locations 
@app.route('/api/byaddressexport', methods=['GET'])
def byaddressexport():
    try:
    
        latitude = request.args.get('latitude', type=float)
        longitude = request.args.get('longitude', type=float)

        filenameextension = datetime.datetime.now().strftime('%Y-%m-%d.%H_%M_%S')
        db = sqlite3.connect(dbFileName)
    
        cursor = db.cursor()

        cursor.execute('''  with base as
                            (
                                select		d.*
                                        -- multiply by 3.280839895 to convert to feet
                                        ,(2 * 6371 * asin(sqrt(0.5 - cos((latitude - ? )*(pi()/180))/2 + cos(? * (pi()/180)) * 
                                            cos(latitude*(pi()/180)) * (1-cos((longitude-(?))*(pi()/180)))/2)) * 1000) * 3.280839895 as distance_value_feet     
                                from		byaddress_summary_data d
                            )

                            select	distinct 
                                    c.unique_key
                                    ,c.created_date
                                    ,c.complaint_type
                                    ,c.descriptor
                                    ,c.incident_zip
                                    ,c.borough
                                    ,c.community_board
                                    ,c.incident_address
                                    ,c.status
                                    ,c.resolution_description
                                    ,round (b.distance_value_feet) as distance_value_feet

                            from	 base b
                                     inner join complaint_data_raw c on b.latitude = round(c.latitude,6) and b.longitude = round(c.longitude,6) 
                           where	 distance_value_feet <= 2000
                           order by  distance_value_feet

		    '''
                        , (latitude, latitude, longitude))
        c = cursor.fetchall()
 
        db.close()
  
        df = pd.DataFrame(c)
        df.columns =['Unique Key'
                    ,'Created Date'
                    ,'Complaint Type'
                    ,'Complaint Descriptor'
                    ,'ZIP5'
                    ,'Borough'
                    ,'Community Board'
                    ,'Address'
                    ,'Status'
                    ,'Resolution'
                    ,'Distance in Feet']

        df['ZIP5'] = df['ZIP5'].astype('string')    
        df['ZIP5'] = df['Distance in Feet'].astype('int')           
        df['Created Date'] = pd.to_datetime(df['Created Date']).dt.strftime('%m/%d/%Y')
   
        file_name =  f'./address_output/Address_Details_{filenameextension}.xlsx'

        df.to_excel(file_name, index=False)
        response = make_response(send_file(file_name, as_attachment=True))
        response.headers.add('Cache-Control', 'private, max-age=300, must-revalidate')
        response.headers.add('Access-Control-Expose-Headers','*')
        response.headers.add('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        return response


    except Exception as error:
        logging.error(error)
        return ("Error", 500)




if __name__ == '__main__':
    app.run(host="0.0.0.0", port=3001, debug=False)

