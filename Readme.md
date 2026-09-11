<<<<<<< HEAD
# 🥗 Nutrition Agent

**IBM EDUNet Foundation Internship Project**

Nutrition Agent is a simple web application that helps users keep track of what they eat during the day. It allows users to search for food items, check their nutritional values, add them to a meal log, and see their total calorie and nutrient intake.

The project also includes **IBM Watson Assistant**, which works as an AI nutrition coach. It can use the user's daily nutrition information and provide suggestions based on their food intake.

---

## 📌 About the Project

It can be difficult to keep track of calories and nutrients when eating different foods throughout the day. This project was developed to make that process easier.

The application uses the **Open Food Facts API** to get nutrition information about food items. After selecting a food, the user can enter the serving size and add it to their daily meal log.

The application then calculates the total amount of calories, protein, carbohydrates, fat, fiber, and sugar consumed during the day.

Users can also open the **AI Coach** to ask nutrition-related questions and get suggestions based on their current meal data.

---

## ✨ Features

* Search for food items using Open Food Facts
* View calories and nutritional information
* Check protein, carbohydrates, fat, fiber and sugar
* Add food items to a daily meal log
* Enter custom serving sizes
* Automatically calculate daily nutrition totals
* View progress toward daily nutrition goals
* Get simple nutrition recommendations
* Chat with an IBM Watson AI nutrition assistant
* Send today's nutrition data to Watson Assistant
* Light and dark mode
* Responsive design for desktop and mobile
* Store meal information using browser LocalStorage

---

## 🛠️ Technologies Used

| Technology           | Used For                              |
| -------------------- | ------------------------------------- |
| HTML5                | Creating the web pages                |
| CSS3                 | Styling and responsive design         |
| JavaScript           | Application logic                     |
| Open Food Facts API  | Food and nutrition data               |
| IBM Watson Assistant | AI nutrition chatbot                  |
| LocalStorage         | Saving meal data in the browser       |
| Watson Web Chat SDK  | Connecting the chatbot to the website |

---

## 🏗️ How the Application Works

The application follows a simple flow:

```text
User searches for food
        ↓
Open Food Facts API
        ↓
Nutrition information is displayed
        ↓
User selects serving size
        ↓
Food is added to Meal Log
        ↓
Daily nutrition totals are updated
        ↓
User can check recommendations
        ↓
User can ask the AI Coach for advice
```

---

## 🔍 Food Search

Users can search for foods such as:

```text
Banana
Apple
Rice
Chicken
Milk
Egg
Bread
Oats
```

The application sends the search request to Open Food Facts and displays the available food products.

The nutrition information can include:

* Calories
* Protein
* Carbohydrates
* Fat
* Fiber
* Sugar
* Nutri-Score

---

## 🍽️ Meal Tracking

After finding a food item, the user can enter the amount they consumed.

For example:

```text
Food: Banana
Serving: 120 g
```

The application calculates the nutrition values for that serving and adds them to the daily meal log.

The meal information is saved in the browser using **LocalStorage**, so it remains available even after refreshing the page.

---

## 📊 Daily Nutrition Tracker

The dashboard shows the user's nutrition intake for the current day.

It tracks:

```text
Calories
Protein
Carbohydrates
Fat
Fiber
Sugar
```

The progress bars make it easier to understand how much of each nutrient has been consumed compared with the daily target.

---

## 💡 Nutrition Recommendations

The application also provides basic recommendations based on the user's current intake.

For example, if the user's protein intake is low, the application can suggest adding foods such as eggs, beans, lentils, yogurt, or other protein-rich foods.

These recommendations are intended for general guidance and are not medical advice.

---

# 🤖 IBM Watson Assistant

One of the main parts of the project is the integration with **IBM Watson Assistant**.

The user can click the **"Ask AI Coach"** button to open the Watson Assistant chat.

Before starting the conversation, the application sends information about the user's current daily intake to Watson Assistant.

### Information sent to Watson

| Variable         | Description                   |
| ---------------- | ----------------------------- |
| `calories_today` | Total calories consumed today |
| `protein_today`  | Total protein consumed        |
| `carbs_today`    | Total carbohydrates consumed  |
| `fat_today`      | Total fat consumed            |
| `fiber_today`    | Total fiber consumed          |
| `sugar_today`    | Total sugar consumed          |
| `meals_logged`   | Number of meals logged        |
| `meal_names`     | Names of the foods logged     |

These values can be used inside Watson Assistant actions.

For example:

```text
${calories_today}
${protein_today}
${carbs_today}
${fat_today}
```

This allows the AI assistant to give responses based on the user's actual logged food rather than only answering general questions.

---

## 🔌 Open Food Facts API

The project uses Open Food Facts to search for food products and retrieve nutrition information.

### Search API

```http
GET https://world.openfoodfacts.org/cgi/search.pl
```

Example:

```text
https://world.openfoodfacts.org/cgi/search.pl
?search_terms=banana
&search_simple=1
&action=process
&json=1
&page_size=5
```

### Product by Barcode

```http
GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json
```

No API key is required for the API calls used in this project.

---

# 📁 Project Structure

```text
nutrition-agent/
│
├── index.html
├── style.css
├── app.js
├── app.json
└── README.md
```

### Files

**index.html**
Contains the main structure of the application and Watson Assistant Web Chat configuration.

**style.css**
Contains the application styles, layout, responsive design and dark/light theme styles.

**app.js**
Handles food searching, API requests, nutrition calculations, meal logging, LocalStorage and recommendations.

**app.json**
Contains application configuration.

**README.md**
Project documentation.

---

# 🚀 How to Run

## Requirements

You only need:

* A modern web browser
* Internet connection
* IBM Cloud account if you want to configure your own Watson Assistant

---

## Run the Project

You can simply open:

```text
index.html
```

in your browser.

A local server is recommended if you are using the Watson Web Chat integration.

### Using Node.js

```bash
npx serve .
```

### Using Python

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

---

# ☁️ IBM Watson Assistant Setup

If you want to connect your own Watson Assistant:

1. Create an IBM Cloud account.
2. Create a Watson Assistant service.
3. Create an Assistant.
4. Add actions for nutrition-related questions.
5. Open **Integrations**.
6. Select **Web chat**.
7. Configure the Web Chat integration.
8. Add the required integration information to the project.
9. Start the application and test the AI Coach.

The Watson Assistant setup can be customized depending on the questions and responses required for the project.

> **Note:** Do not upload private API keys, access tokens or other confidential credentials to GitHub.

---

# 🧮 Nutrition Calculation

Most nutrition information is provided per 100 g.

When the user enters a different serving size, the application calculates the corresponding amount.

The calculation is:

```text
Nutrition for serving
=
(Nutrition per 100 g × Serving size) / 100
```

For example:

```text
Calories = 89 kcal per 100 g
Serving  = 150 g

(89 × 150) / 100
= 133.5 kcal
```

The calculated value is then added to the user's daily total.

---

# 💾 LocalStorage

The project does not currently require a separate database.

Meal information is stored in the browser using:

```javascript
localStorage
```

This keeps the project simple and makes it possible to run the application locally without setting up a backend server.

---

# 📱 Responsive Design

The website is designed to work on different screen sizes, including:

* Desktop
* Laptop
* Tablet
* Mobile

The layout adjusts automatically based on the screen size.

---

# 🌙 Dark Mode

The application includes a light/dark mode option.

The selected theme is saved locally so that the user's preference can be maintained when they return to the application.

---

# 🔮 Future Improvements

There are several features that could be added in the future:

* Barcode scanning
* Food image recognition
* User login and registration
* Cloud database
* Weekly and monthly reports
* Personalized meal plans
* Exercise tracking
* Water intake tracking
* More detailed nutrition charts
* AI-generated meal suggestions
* Mobile application
* Better personalization based on user goals

---

# 🎓 Internship Details

| Details          | Information                         |
| ---------------- | ----------------------------------- |
| **Program**      | IBM EDUNet Foundation Internship    |
| **Project Name** | Nutrition Agent                     |
| **Domain**       | Artificial Intelligence / Nutrition |
| **Frontend**     | HTML, CSS, JavaScript               |
| **AI**           | IBM Watson Assistant                |
| **Food API**     | Open Food Facts                     |
| **Storage**      | LocalStorage                        |

---

# 📚 What I Learned

While working on this project, I got practical experience with:

* Creating a responsive web application
* Working with REST APIs
* Fetching and displaying JSON data
* Using JavaScript for application logic
* Working with browser LocalStorage
* Integrating IBM Watson Assistant
* Passing data between a website and an AI assistant
* Creating a simple nutrition tracking system
* Building a project from an idea to a working application

---

# ⚠️ Disclaimer

This project is created for **educational purposes** as part of the IBM EDUNet Foundation Internship.

The nutrition information comes from an external food database and may not always be completely accurate.

The recommendations provided by the application are for general informational purposes and should not be treated as professional medical or dietary advice.

---

# 👨‍💻 Project

**Nutrition Agent**

*IBM EDUNet Foundation Internship Project*

> 🥗 Search your food. Track your nutrition. Ask your AI Coach.
=======
# Nutrition_Agent
A web application designed to help users create, track, and maintain personalized nutrition and meal plans to achieve their health goals.
>>>>>>> 98af5bb1506766562ce19da8cdbca5933dfa7d73
