import pandas as pd
import json
import random

# Load the csv file with UTF-8 encoding to handle Vietnamese content
df = pd.read_csv('meta_data_phone.csv', encoding='utf-8')

# Filter the dataframe to get only iphones
iphones_df = df[df['type'] == 'iPhone']

# Get 20 random rows from the dataframe
random_iphones = iphones_df.sample(n=20, random_state=42)

# Convert the dataframe to json
random_iphones_json = random_iphones.to_json(orient='records', force_ascii=False)

# Export it to a file
with open('random_iphones.json', 'w', encoding='utf-8') as f:
    f.write(random_iphones_json)

