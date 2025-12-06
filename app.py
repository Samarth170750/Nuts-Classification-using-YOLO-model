from flask import Flask, render_template, request, jsonify
import pandas as pd
import os
from sklearn.preprocessing import MinMaxScaler
from werkzeug.utils import secure_filename
from detect_text_output import detect_nut

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'

DATA_FILE = os.path.join('data', 'suppliers.xlsx')

# Recommender logic
def recommend_products(json_data):
    df = pd.DataFrame(json_data)

    if 'Rating' not in df.columns or 'No_of_Reviews' not in df.columns:
        raise ValueError("JSON data must contain 'Rating' and 'No_of_Reviews' fields")

    weight_rating = 0.60
    weight_reviews = 0.40

    scaler = MinMaxScaler()
    df['Normalized_Rating'] = scaler.fit_transform(df[['Rating']])
    df['Normalized_Reviews'] = scaler.fit_transform(df[['No_of_Reviews']])

    df['Score'] = (
        (weight_rating * df['Normalized_Rating']) +
        (weight_reviews * df['Normalized_Reviews'])
    )

    df = df.sort_values(by='Score', ascending=False)
    return df.to_dict(orient='records')

# Supplier search logic
def search_suppliers(product, location=None, max_price=None):
    try:
        df = pd.read_excel(DATA_FILE)
        df = df.fillna('')
        df = df.astype(str)
        results = df.copy()

        if product:
            results = results[results['Sub-Category'].str.lower() == product.lower()]

        if location:
            results = results[results['City'].str.lower() == location.lower()]

        if max_price is not None and 'Price' in results.columns:
            results['Price'] = results['Price'].replace(r'[^\d.,]', '', regex=True)
            results['Price'] = results['Price'].str.replace(',', '')
            results['Price'] = pd.to_numeric(results['Price'], errors='coerce')
            results = results.dropna(subset=['Price'])
            max_price = float(max_price)
            results = results[results['Price'] <= max_price]

        return results.to_dict('records')

    except Exception as e:
        return []

# Routes
@app.route('/')
def index():
    df = pd.read_excel(DATA_FILE)
    df = df.fillna('')
    df = df.astype(str)
    Sub_category = df['Sub-Category'].unique().tolist()
    City = df['City'].unique().tolist()

    return render_template('index.html', Sub_category=Sub_category, City=City)

@app.route('/search', methods=['POST'])
def search():
    data = request.json or {}
    product = data.get('product', '').strip()
    location = data.get('location', '').strip()
    max_price = data.get('max_price', 150000)

    if not product and not location:
        return jsonify({'results': []})

    results = search_suppliers(product, location, max_price)
    results = recommend_products(results)
    return jsonify({'results': results})

@app.route('/search-by-image', methods=['POST'])
def search_by_image():
    print("started")
    if 'image' not in request.files:
        print({'error': 'No image uploaded'})
    
    image = request.files['image']
    if image.filename == '':
        print({'error': 'No selected image'})

    filename = secure_filename(image.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    image.save(filepath)
    location = request.form.get('location')
    max_price = request.form.get('max_price')

    try:
        # Predict product using YOLO
        product_name = detect_nut(filepath)[0]
        print("Product name",product_name)
        if not product_name:
            print({'results': [], 'message': 'No product detected'})
        
        raw_results = search_suppliers(product_name, location, max_price)
        

        recommended = recommend_products(raw_results)
        return jsonify({'results': recommended})


    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
