# NoisyNYC, a data driven approach to measuring noise in NYC.

Code repository behind [NoisyNYC](https://noisynyc.com). 

- noisynyc-api: Flask-based backend API used to provide details when user makes certain selections and creates on-demand extracts.
- noisynyc-etl: Python scripts to extract complaint data, load into DB (sqlite3), and generate lookup tables and static extracts. Site was designed to run on extremely low-end VPS's, majority of data files are pregenerated for a better user experience. 
- noisynyc-web: React-based UI.


To run locally:
- Optionally create Python virtual environment.
- Install requirements.txt.
- Run npm install in noisynyc-web.
- Run backend_api.py.
- Create ./noisynyc-web/src/variables/Tokens.js file and add "export const mapboxApiToken = "YOUR_MAPBOX_API_TOKEN";
- Run npm start. 



