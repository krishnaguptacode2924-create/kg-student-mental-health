def kg_student_prediction(input_set):

    import numpy as np
    import pandas as pd
    import joblib as jb

    stress     = jb.load("KG_Student_Artifact/KG_Student_Stress.joblib")
    anxiety    = jb.load("KG_Student_Artifact/KG_Student_Anxiety.joblib")
    depression = jb.load("KG_Student_Artifact/KG_Student_Depression.joblib")

    models = {'stress' : stress, 'anxiety' : anxiety, 'depression' : depression}
    result = {'Condition' : [], 'Prediction' : [], 'Prediction_Score' : [], 'Confidence' : []}

    df = pd.DataFrame([input_set])

    # For Course feature, convert input to code
    df['Course'] = df['Course'].map(
        {
            'Medical' : 0, 'Law' : 1, 'Engineering' : 2, 
            'Computer Science': 3, 'Business' : 4, 'Others' : 5
            }
            )
    
    # For Female feature, convert input to code
    df['Female'] = df['Female'].map({'Male' : 0, 'Female' : 1})

    # For Sleep Quality feature, convert input to code
    df['Sleep_Quality'] = df['Sleep_Quality'].map({'Poor' : 0, 'Average' : 1, 'Good' : 2})

    # For Diet Quality feature, convert input to code
    df['Diet_Quality'] = df['Diet_Quality'].map({'Poor' : 0, 'Average' : 1, 'Good' : 2})

    # For Physical Activity feature, convert input to code
    df['Physical_Activity'] = df['Physical_Activity'].map({'Low' : 0, 'Moderate' : 1, 'High' : 2})

    # For Social Support feature, convert input to code
    df['Social_Support'] = df['Social_Support'].map({'Low' : 0, 'Moderate' : 1, 'High' : 2})

    # For Extracurricular Activity feature, convert input to code
    df['Extracurricular_Activity'] = df['Extracurricular_Activity'].map({'Low' : 0, 'Moderate' : 1, 'High' : 2})

    # For Relationship Status feature, convert input to code
    df['Relationship_Status'] = df['Relationship_Status'].map({'Single' : 0, 'Committed' : 1, 'Married' : 2})

    # For Substance Use feature, convert input to code
    df['Substance_Use'] = df['Substance_Use'].map({'Frequently' : 0, 'Occasionally' : 1, 'Never' : 2})

    # For Family History feature, convert input to code
    df['Family_History'] = df['Family_History'].map({'No' : 0, 'Yes' : 1})

    # For Chronic Illness feature, convert input to code
    df['Chronic_Illness'] = df['Chronic_Illness'].map({'No' : 0, 'Yes' : 1})

    # For Residence Type feature, convert input to code
    df['Residence_Type'] = df['Residence_Type'].map({'On-Campus' : 0, 'Off-Campus' : 1, 'With Family' : 2})

    df = df[
        [
            'Age', 'Course', 'Female', 'CGPA', 'Sleep_Quality', 
            'Physical_Activity', 'Diet_Quality','Social_Support', 
            'Relationship_Status', 'Substance_Use','Family_History', 
            'Chronic_Illness', 'Financial_Stress','Extracurricular_Activity', 
            'Residence_Type']
    ]

    for model in models:
        prediction = models[model].predict(df)   
        probabilities = models[model].predict_proba(df)[0]
        confidence = round(float(max(probabilities) * 100), 2)

        if (prediction[0] == 0 or prediction[0] == 1):
            result['Prediction'].append('Mild')
        elif (prediction[0] == 2 or prediction[0] == 3):
            result['Prediction'].append('Moderate')
        elif (prediction[0] == 4 or prediction[0] == 5):
            result['Prediction'].append('Severe')

        result['Condition'].append(model)
        result['Confidence'].append(confidence)
        result['Prediction_Score'].append(prediction[0])

    return result