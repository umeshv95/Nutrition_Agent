// ── Load config from app.json ─────────────────────────────────
let CONFIG = {};
let goals  = {};

async function loadConfig() {
  try {
    const res = await fetch('./app.json');
    CONFIG = await res.json();
    const saved = localStorage.getItem(CONFIG.config.storage.goalsKey);
    goals = saved ? JSON.parse(saved) : { ...CONFIG.config.dailyGoals };
  } catch {
    CONFIG = { config: { api: { openFoodFacts: { baseUrl: 'https://world.openfoodfacts.org', searchEndpoint: '/api/v2/search', pageSize: 8 } }, dailyGoals: { calories:2000,protein_g:50,carbs_g:275,fat_g:78,fiber_g:28,sugar_g:50 }, theme: { default:'light', storageKey:'nutrition-agent-theme' }, storage: { mealLogKey:'nutrition-agent-meal-log', goalsKey:'nutrition-agent-goals' }, ui: { maxSearchResults:8, defaultServing_g:100, toastDuration_ms:3000 } }, nutriScoreColors: { A:'#038141',B:'#85BB2F',C:'#FECB02',D:'#EE8100',E:'#E63E11' }, macroColors: { calories:'#3b82f6',protein:'#10b981',carbs:'#f59e0b',fat:'#ef4444',fiber:'#8b5cf6',sugar:'#ec4899' } };
    goals = { ...CONFIG.config.dailyGoals };
  }
  applyTheme(localStorage.getItem(CONFIG.config.theme.storageKey) || CONFIG.config.theme.default);
  renderTracker();
  renderTips();
  renderMealLog();
}

// ── Watson Assistant Chat Open ────────────────────────────────
function openWatsonChat() {
  var instance = window._watsonInstance;
  if (!instance) {
    showToast('⏳ Watson Assistant is loading, please try again shortly.');
    return;
  }
  instance.openWindow();
}

// ── Built-in AI Chat (Granite-style nutrition Q&A) ────────────
const AI_KB = [
  // Diet plan
  { q: ['diet plan','meal plan','weekly plan','what to eat','food plan','eating plan'],
    a: `Here's a simple balanced <strong>Diet Plan</strong> to follow:<br><br>
🌅 <strong>Breakfast:</strong> Oats / eggs / Greek yogurt with fruit<br>
☀️ <strong>Lunch:</strong> Grilled protein (chicken/fish/tofu) + brown rice + salad<br>
🌙 <strong>Dinner:</strong> Lentil soup / baked salmon / stir-fry veggies<br>
🍎 <strong>Snacks:</strong> Nuts, fruit, or low-fat yogurt<br><br>
Aim for <strong>3 meals + 2 snacks</strong> daily, drink 8 glasses of water, and avoid processed foods.` },

  // Calories
  { q: ['calorie','calories','kcal','how many calories','caloric'],
    a: `<strong>Calorie Guidelines:</strong><br><br>
• Average adult needs <strong>1800–2200 kcal/day</strong><br>
• Weight loss: reduce by 300–500 kcal/day<br>
• Weight gain: increase by 300–500 kcal/day<br>
• Calories per gram: Protein = 4 kcal, Carbs = 4 kcal, Fat = 9 kcal<br><br>
Your current logged intake today: <strong>${() => Math.round((window._nutritionTotals||{}).calories||0)} kcal</strong>` },

  // Protein
  { q: ['protein','proteins','muscle','amino','lean muscle'],
    a: `<strong>Protein Tips:</strong><br><br>
• Daily target: <strong>0.8–1.2g per kg of body weight</strong><br>
• For muscle building: up to <strong>1.6–2g/kg</strong><br>
• Best sources: chicken, fish, eggs, lentils, tofu, Greek yogurt, cottage cheese<br>
• Spread intake across meals for best absorption<br><br>
Your logged protein today: <strong>${() => Math.round((window._nutritionTotals||{}).protein||0)}g</strong>` },

  // Carbs
  { q: ['carb','carbs','carbohydrate','sugar','glucose','bread','rice','pasta'],
    a: `<strong>Carbohydrate Advice:</strong><br><br>
• Carbs should be <strong>45–65%</strong> of your daily calories<br>
• Choose <strong>complex carbs</strong>: oats, brown rice, sweet potato, quinoa, whole wheat<br>
• Limit <strong>simple carbs</strong>: white bread, sugary drinks, sweets, pastries<br>
• Fiber-rich carbs keep you full longer — aim for <strong>25–30g fiber/day</strong>` },

  // Fat
  { q: ['fat','fats','healthy fat','omega','avocado','oil','butter'],
    a: `<strong>Healthy Fats Guide:</strong><br><br>
• Fat should be <strong>20–35%</strong> of daily calories<br>
• ✅ <strong>Good fats:</strong> olive oil, avocado, nuts, seeds, fatty fish (omega-3)<br>
• ❌ <strong>Avoid:</strong> trans fats, excess saturated fats (fried food, margarine)<br>
• Omega-3 fatty acids reduce inflammation and support heart health` },

  // Weight loss
  { q: ['weight loss','lose weight','slim','fat loss','cut weight','reduce weight'],
    a: `<strong>Weight Loss Tips (Evidence-Based):</strong><br><br>
1. Create a calorie deficit of <strong>300–500 kcal/day</strong><br>
2. Eat more <strong>protein and fiber</strong> — they keep you full<br>
3. Reduce ultra-processed foods, sugar, and alcohol<br>
4. Exercise at least <strong>150 min/week</strong> (cardio + strength)<br>
5. Sleep 7–9 hours — poor sleep increases hunger hormones<br>
6. Stay hydrated — thirst is often mistaken for hunger` },

  // Weight gain
  { q: ['weight gain','gain weight','bulk','muscle mass','underweight'],
    a: `<strong>Healthy Weight Gain Tips:</strong><br><br>
1. Eat a <strong>300–500 kcal surplus</strong> above your maintenance<br>
2. Prioritise <strong>protein</strong> (1.6–2g/kg) to build muscle, not just fat<br>
3. Include calorie-dense foods: nuts, nut butters, whole milk, oats, rice<br>
4. Do <strong>resistance/strength training</strong> to direct calories to muscle<br>
5. Eat 5–6 smaller meals if you struggle to eat large portions` },

  // Hydration / water
  { q: ['water','hydrate','hydration','drink','thirst','fluid'],
    a: `<strong>Hydration Guide:</strong><br><br>
• Aim for <strong>8–10 glasses (2–2.5 litres)</strong> of water per day<br>
• Increase intake in hot weather or when exercising<br>
• Signs of dehydration: dark urine, fatigue, headache, dry mouth<br>
• Drink a glass of water <strong>before each meal</strong> to control appetite<br>
• Limit sugary drinks and excessive caffeine` },

  // Diabetes / blood sugar
  { q: ['diabetes','blood sugar','insulin','glucose level','glycemic'],
    a: `<strong>Nutrition for Blood Sugar Management:</strong><br><br>
• Choose <strong>low glycemic index (GI)</strong> foods: oats, legumes, most vegetables<br>
• Avoid sugary drinks, white bread, sweets, and processed snacks<br>
• Eat <strong>small, frequent meals</strong> to avoid blood sugar spikes<br>
• Pair carbs with protein or fat to slow glucose absorption<br>
• Monitor portions of rice, bread, and fruit<br><br>
⚠️ <em>Please consult your doctor for personalised diabetes management.</em>` },

  // Vitamins / deficiency
  { q: ['vitamin','mineral','deficiency','iron','calcium','b12','d3','folate','zinc'],
    a: `<strong>Key Vitamins & Minerals:</strong><br><br>
• <strong>Vitamin D:</strong> sunlight, fatty fish, fortified milk — deficiency is very common<br>
• <strong>Vitamin B12:</strong> meat, eggs, dairy — vegans often need supplements<br>
• <strong>Iron:</strong> red meat, lentils, spinach — pair with Vitamin C for absorption<br>
• <strong>Calcium:</strong> dairy, leafy greens, tofu — essential for bones<br>
• <strong>Folate:</strong> leafy greens, legumes — critical during pregnancy<br><br>
Get a <strong>blood test</strong> to check your levels before supplementing.` },

  // Vegetables / fruits
  { q: ['vegetable','vegetables','fruit','fruits','greens','salad'],
    a: `<strong>Why Eat More Vegetables & Fruits:</strong><br><br>
• Aim for <strong>5+ servings</strong> of vegetables and fruits daily<br>
• Rich in vitamins, minerals, antioxidants, and fiber<br>
• Fill <strong>half your plate</strong> with vegetables at every meal<br>
• Best choices: broccoli, spinach, carrots, berries, apples, citrus<br>
• Frozen and canned (no added salt/sugar) are just as nutritious as fresh` },

  // Gut health
  { q: ['gut','digestion','digestive','probiotics','fiber','bloating','ibs'],
    a: `<strong>Gut Health & Digestion Tips:</strong><br><br>
• Eat <strong>25–30g of fiber/day</strong>: whole grains, legumes, vegetables, fruit<br>
• Include <strong>probiotic foods</strong>: yogurt, kefir, kimchi, sauerkraut<br>
• Prebiotic foods feed good bacteria: garlic, onion, bananas, oats<br>
• Stay well hydrated to keep digestion moving<br>
• Reduce alcohol, excess sugar, and processed food<br><br>
⚠️ <em>If you have IBS or chronic bloating, consult a gastroenterologist.</em>` },

  // Doctor / consult
  { q: ['doctor','consult','medical','physician','dietitian','specialist','health check'],
    a: `<strong>When to See a Healthcare Professional:</strong><br><br>
• Unexplained weight changes (>5kg in a month)<br>
• Persistent fatigue, weakness, or dizziness<br>
• Diagnosed conditions: diabetes, hypertension, high cholesterol, PCOS<br>
• Food allergies or intolerances<br>
• Eating disorders<br><br>
<strong>Who to see:</strong><br>
👨‍⚕️ GP — general check-up and blood tests<br>
🥗 Registered Dietitian — personalised meal planning<br>
🔬 Endocrinologist — hormone-related weight issues` },

  // Default
  { q: ['hello','hi','hey','help','start','coach'],
    a: `👋 Hello! I'm your <strong>AI Nutrition Coach</strong> powered by <strong>IBM Granite</strong>.<br><br>
I can help you with:<br>
• 🥦 <strong>Diet plans</strong> and meal ideas<br>
• 💡 <strong>Nutrition tips</strong> and healthy habits<br>
• 📊 <strong>Macro guidance</strong> (protein, carbs, fat, calories)<br>
• 🩺 <strong>Doctor consult</strong> advice<br><br>
Just type your question!` }
];

function getAIResponse(userText) {
  const text = userText.toLowerCase();
  // Check current nutrition totals for personalised answers
  const totals = window._nutritionTotals || {};

  // Personalised current-log response
  if (/how am i doing|my progress|today'?s? (intake|nutrition|calories|log)|track/i.test(text)) {
    const cal = Math.round(totals.calories || 0);
    const prot = Math.round(totals.protein || 0);
    const carb = Math.round(totals.carbs || 0);
    const fat = Math.round(totals.fat || 0);
    return `<strong>Your nutrition today:</strong><br><br>
🔵 Calories: <strong>${cal} kcal</strong> / 2000 kcal goal<br>
🟢 Protein: <strong>${prot}g</strong> / 50g goal<br>
🟡 Carbs: <strong>${carb}g</strong> / 275g goal<br>
🔴 Fat: <strong>${fat}g</strong> / 78g goal<br><br>
${cal < 1200 ? '⚠️ You\'ve eaten very little today — make sure to have a proper meal!' :
  cal > 2200 ? '⚠️ You\'re over your calorie goal. Consider lighter options for your next meal.' :
  '✅ Your intake looks balanced so far. Keep it up!'}`;
  }

  // Match KB entries
  for (const entry of AI_KB) {
    if (entry.q.some(kw => text.includes(kw))) {
      // Resolve any lazy functions in the answer
      return entry.a.replace(/\$\{[^}]+\}/g, m => {
        try { return eval(m.slice(2, -1))(); } catch { return ''; }
      });
    }
  }

  return `I don't have a specific answer for "<strong>${userText}</strong>" yet, but here are things I can help with:<br><br>
• Diet plans &amp; weekly meal ideas<br>
• Calorie &amp; macro guidance<br>
• Protein, carbs, fat tips<br>
• Weight loss / weight gain<br>
• Vitamins &amp; deficiencies<br>
• Doctor consult advice<br><br>
Try asking something like: <em>"Give me a diet plan"</em> or <em>"How much protein do I need?"</em>`;
}

function toggleAIChat() {
  const panel = document.getElementById('ai-chat-panel');
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) {
    document.getElementById('ai-chat-input').focus();
  }
}

function sendAIMessage() {
  const input = document.getElementById('ai-chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  const messages = document.getElementById('ai-chat-messages');

  // Add user message
  messages.innerHTML += `<div class="ai-msg user"><div class="ai-msg-bubble">${text}</div></div>`;

  // Add typing indicator
  const typingId = 'typing-' + Date.now();
  messages.innerHTML += `<div class="ai-msg bot ai-msg-typing" id="${typingId}">
    <div class="ai-msg-bubble">
      <div class="ai-typing-dot"></div>
      <div class="ai-typing-dot"></div>
      <div class="ai-typing-dot"></div>
    </div>
  </div>`;
  messages.scrollTop = messages.scrollHeight;

  // Simulate Granite response delay (600–1000ms)
  setTimeout(() => {
    const typing = document.getElementById(typingId);
    if (typing) typing.remove();
    const reply = getAIResponse(text);
    messages.innerHTML += `<div class="ai-msg bot"><div class="ai-msg-bubble">${reply}</div></div>`;
    messages.scrollTop = messages.scrollHeight;
  }, 600 + Math.random() * 400);
}

function openWatsonWithMessage(message) {
  var instance = window._watsonInstance;
  if (!instance) {
    showToast('⏳ AI Coach is loading, please try again shortly.');
    return;
  }
  instance.openWindow();
  instance.send({ input: { text: message } });
}

// ── Feature Modal Content ─────────────────────────────────────
const FEATURE_CONTENT = {
  diet: {
    icon: '🥦',
    iconBg: '#eff6ff',
    iconColor: '#2563eb',
    title: 'Diet Plan',
    subtitle: 'A balanced weekly plan to follow',
    body: `
      <div class="feature-section">
        <div class="feature-section-title">🎯 General Guidelines</div>
        <ul class="feature-list">
          <li>Eat <strong>3 main meals</strong> and 1–2 healthy snacks per day.</li>
          <li>Drink at least <strong>8 glasses of water</strong> daily.</li>
          <li>Avoid processed foods, added sugar, and excess salt.</li>
          <li>Include a variety of colours on your plate (vegetables &amp; fruits).</li>
        </ul>
      </div>
      <div class="feature-section">
        <div class="feature-section-title">📅 Sample Weekly Diet Plan</div>
        <div class="feature-day-grid">
          <div class="feature-day-card">
            <div class="feature-day-label">Monday</div>
            <div class="feature-day-meal"><span>🌅 Breakfast</span> Oats with banana &amp; chia seeds</div>
            <div class="feature-day-meal"><span>☀️ Lunch</span> Grilled chicken, brown rice, salad</div>
            <div class="feature-day-meal"><span>🌙 Dinner</span> Lentil soup &amp; whole wheat bread</div>
          </div>
          <div class="feature-day-card">
            <div class="feature-day-label">Tuesday</div>
            <div class="feature-day-meal"><span>🌅 Breakfast</span> Greek yogurt with berries &amp; honey</div>
            <div class="feature-day-meal"><span>☀️ Lunch</span> Tuna salad with quinoa</div>
            <div class="feature-day-meal"><span>🌙 Dinner</span> Stir-fried tofu &amp; vegetables</div>
          </div>
          <div class="feature-day-card">
            <div class="feature-day-label">Wednesday</div>
            <div class="feature-day-meal"><span>🌅 Breakfast</span> Whole grain toast, eggs, avocado</div>
            <div class="feature-day-meal"><span>☀️ Lunch</span> Vegetable soup &amp; mixed grain bowl</div>
            <div class="feature-day-meal"><span>🌙 Dinner</span> Baked salmon with steamed broccoli</div>
          </div>
          <div class="feature-day-card">
            <div class="feature-day-label">Thursday</div>
            <div class="feature-day-meal"><span>🌅 Breakfast</span> Smoothie: spinach, apple, flaxseed</div>
            <div class="feature-day-meal"><span>☀️ Lunch</span> Chickpea curry &amp; brown rice</div>
            <div class="feature-day-meal"><span>🌙 Dinner</span> Turkey meatballs &amp; zucchini pasta</div>
          </div>
          <div class="feature-day-card">
            <div class="feature-day-label">Friday</div>
            <div class="feature-day-meal"><span>🌅 Breakfast</span> Overnight oats with almonds</div>
            <div class="feature-day-meal"><span>☀️ Lunch</span> Egg &amp; vegetable wrap</div>
            <div class="feature-day-meal"><span>🌙 Dinner</span> Grilled fish with sweet potato</div>
          </div>
          <div class="feature-day-card">
            <div class="feature-day-label">Weekend</div>
            <div class="feature-day-meal"><span>🌅 Breakfast</span> Pancakes with fruit (no syrup)</div>
            <div class="feature-day-meal"><span>☀️ Lunch</span> Bean &amp; vegetable stew</div>
            <div class="feature-day-meal"><span>🌙 Dinner</span> Lean beef stir-fry &amp; veggies</div>
          </div>
        </div>
      </div>
      <div class="feature-section">
        <div class="feature-section-title">🥗 Recommended Macros per Day</div>
        <div class="feature-macro-row">
          <span class="feature-macro-badge" style="background:#3b82f6">Calories: 1800–2200 kcal</span>
          <span class="feature-macro-badge" style="background:#10b981">Protein: 50–70 g</span>
          <span class="feature-macro-badge" style="background:#f59e0b">Carbs: 230–280 g</span>
          <span class="feature-macro-badge" style="background:#ef4444">Fat: 60–80 g</span>
          <span class="feature-macro-badge" style="background:#8b5cf6">Fiber: 25–30 g</span>
        </div>
      </div>`
  },

  tips: {
    icon: '💡',
    iconBg: '#f0fdf4',
    iconColor: '#16a34a',
    title: 'Nutrition Tips',
    subtitle: 'Smart habits for a healthier you',
    body: `
      <div class="feature-section">
        <div class="feature-section-title">🥤 Hydration</div>
        <ul class="feature-list">
          <li>Drink a glass of water <strong>before every meal</strong> to control appetite.</li>
          <li>Limit sugary drinks, juices, and sodas.</li>
          <li>Herbal teas count towards daily fluid intake.</li>
        </ul>
      </div>
      <div class="feature-section">
        <div class="feature-section-title">🍽️ Eating Habits</div>
        <ul class="feature-list">
          <li>Eat slowly — it takes 20 minutes for your brain to register fullness.</li>
          <li>Use smaller plates to avoid overeating.</li>
          <li>Never skip breakfast — it jump-starts your metabolism.</li>
          <li>Eat your last meal at least <strong>2–3 hours before bed</strong>.</li>
        </ul>
      </div>
      <div class="feature-section">
        <div class="feature-section-title">🥦 Food Choices</div>
        <ul class="feature-list">
          <li>Choose <strong>whole grains</strong> over refined grains (white bread, white rice).</li>
          <li>Fill half your plate with <strong>vegetables and fruits</strong>.</li>
          <li>Opt for <strong>lean proteins</strong>: chicken, fish, legumes, eggs, tofu.</li>
          <li>Use healthy fats: olive oil, avocado, nuts — in moderation.</li>
          <li>Read food labels — watch out for hidden sugars and sodium.</li>
        </ul>
      </div>
      <div class="feature-section">
        <div class="feature-section-title">⚠️ What to Avoid</div>
        <ul class="feature-list">
          <li>Ultra-processed snacks (chips, cookies, fast food).</li>
          <li>Excess added sugar — limit to under 50 g/day.</li>
          <li>Skipping meals, which leads to overeating later.</li>
          <li>Eating while distracted (TV, phone) — leads to mindless eating.</li>
        </ul>
      </div>`
  },

  doctor: {
    icon: '🩺',
    iconBg: '#fdf4ff',
    iconColor: '#9333ea',
    title: 'Doctor Consult',
    subtitle: 'When and why to seek professional advice',
    body: `
      <div class="feature-section">
        <div class="feature-section-title">🚨 When to See a Doctor</div>
        <ul class="feature-list">
          <li>Unexplained <strong>weight loss or gain</strong> of more than 5 kg in a month.</li>
          <li>Persistent <strong>fatigue, weakness</strong>, or dizziness despite eating well.</li>
          <li>Diagnosed conditions: <strong>diabetes, hypertension, high cholesterol, PCOS</strong>, thyroid issues.</li>
          <li>Food allergies, intolerances, or <strong>digestive issues</strong> (bloating, IBS).</li>
          <li>Eating disorders (anorexia, binge eating, orthorexia).</li>
          <li>Pregnancy or breastfeeding — nutritional needs change significantly.</li>
        </ul>
      </div>
      <div class="feature-section">
        <div class="feature-section-title">👨‍⚕️ Who to Consult</div>
        <div class="feature-day-grid">
          <div class="feature-day-card">
            <div class="feature-day-label">General Physician (GP)</div>
            <div class="feature-day-meal">For overall health checks, blood tests (glucose, cholesterol, iron), and referrals.</div>
          </div>
          <div class="feature-day-card">
            <div class="feature-day-label">Registered Dietitian (RD)</div>
            <div class="feature-day-meal">For personalised meal plans, chronic disease nutrition, and weight management.</div>
          </div>
          <div class="feature-day-card">
            <div class="feature-day-label">Endocrinologist</div>
            <div class="feature-day-meal">For hormone-related issues affecting weight: thyroid, insulin resistance, PCOS.</div>
          </div>
          <div class="feature-day-card">
            <div class="feature-day-label">Gastroenterologist</div>
            <div class="feature-day-meal">For digestive problems, food intolerances, celiac disease, or IBS.</div>
          </div>
        </div>
      </div>
      <div class="feature-section">
        <div class="feature-section-title">📋 Tests to Ask For</div>
        <ul class="feature-list">
          <li><strong>Complete Blood Count (CBC)</strong> — checks for anaemia and general health.</li>
          <li><strong>Blood glucose &amp; HbA1c</strong> — screens for diabetes.</li>
          <li><strong>Lipid panel</strong> — checks cholesterol and triglycerides.</li>
          <li><strong>Vitamin D, B12, iron, folate</strong> — common deficiencies from poor diet.</li>
          <li><strong>Thyroid function (TSH, T3, T4)</strong> — if you have unexplained weight changes.</li>
        </ul>
      </div>
      <div class="tip warn" style="margin-top:8px">
        ⚠️ This app provides general nutrition information only. Always consult a qualified healthcare professional for medical advice.
      </div>`
  }
};

function openFeatureModal(type) {
  try {
    const content = FEATURE_CONTENT[type];
    if (!content) return;
    const iconEl = document.getElementById('feature-modal-icon');
    iconEl.textContent = content.icon;
    iconEl.style.background = content.iconBg;
    iconEl.style.color = content.iconColor;
    document.getElementById('feature-modal-title').textContent    = content.title;
    document.getElementById('feature-modal-subtitle').textContent = content.subtitle;
    document.getElementById('feature-modal-body').innerHTML       = content.body;
    document.getElementById('feature-modal-overlay').classList.add('open');
  } catch(e) {
    console.error('openFeatureModal error:', e);
    showToast('⚠️ Could not open panel. Please refresh the page.');
  }
}

function closeFeatureModal() {
  document.getElementById('feature-modal-overlay').classList.remove('open');
}

// ── Theme ─────────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-btn').textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
  localStorage.setItem(CONFIG.config.theme.storageKey, theme);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}

// ── Meal Log (localStorage) ───────────────────────────────────
function _mealLogKey() {
  return (CONFIG.config && CONFIG.config.storage && CONFIG.config.storage.mealLogKey)
    || 'nutrition-agent-meal-log';
}

function getMealLog() {
  try {
    return JSON.parse(localStorage.getItem(_mealLogKey())) || [];
  } catch { return []; }
}

function saveMealLog(log) {
  localStorage.setItem(_mealLogKey(), JSON.stringify(log));
}

function addToLog(item) {
  const log = getMealLog();
  log.push({ ...item, id: Date.now() });
  saveMealLog(log);
  renderMealLog();
  renderTracker();
  renderTips();
  showToast(`✅ ${item.name} added to your log`);
}

function removeFromLog(id) {
  const log = getMealLog().filter(i => i.id !== id);
  saveMealLog(log);
  renderMealLog();
  renderTracker();
  renderTips();
}

function clearLog() {
  if (!confirm('Clear today\'s meal log?')) return;
  saveMealLog([]);
  renderMealLog();
  renderTracker();
  renderTips();
  showToast('🗑️ Log cleared');
}

// ── API Search ────────────────────────────────────────────────
async function searchFood(query) {
  const api = (CONFIG.config && CONFIG.config.api && CONFIG.config.api.openFoodFacts) ||
              { baseUrl: 'https://world.openfoodfacts.org', searchEndpoint: '/api/v2/search', pageSize: 8 };
  const { baseUrl, searchEndpoint, pageSize } = api;
  const url = `${baseUrl}${searchEndpoint}?q=${encodeURIComponent(query)}&page_size=${pageSize}&fields=product_name,brands,nutriments,nutriscore_grade,image_small_url,code`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('API error');
  const data = await res.json();
  return (data.products || []).filter(p => p.product_name);
}

// ── Extract Nutrients ─────────────────────────────────────────
function getNutrients(p, serving = 100) {
  const n = p.nutriments || {};
  const factor = serving / 100;
  return {
    calories: Math.round((n['energy-kcal_100g'] || n['energy-kcal'] || 0) * factor),
    protein:  Math.round(((n['proteins_100g']  || n.proteins  || 0) * factor) * 10) / 10,
    carbs:    Math.round(((n['carbohydrates_100g'] || n.carbohydrates || 0) * factor) * 10) / 10,
    fat:      Math.round(((n['fat_100g']        || n.fat        || 0) * factor) * 10) / 10,
    fiber:    Math.round(((n['fiber_100g']       || n.fiber      || 0) * factor) * 10) / 10,
    sugar:    Math.round(((n['sugars_100g']      || n.sugars     || 0) * factor) * 10) / 10,
  };
}

// ── Render Search Results ─────────────────────────────────────
let _searchProducts = [];

function renderResults(products) {
  _searchProducts = products;
  const container = document.getElementById('search-results');
  if (!products.length) {
    container.innerHTML = '<p class="empty-state">No results found. Try a different term.</p>';
    return;
  }
  container.innerHTML = products.map((p, i) => {
    const n = getNutrients(p, 100);
    const score = (p.nutriscore_grade || '').toUpperCase();
    const scoreColor = _nsc()[score] || '#aaa';
    const img = p.image_small_url || '';
    const mc = _mc();
    return `
    <div class="food-card" onclick="openModal(_searchProducts[${i}])">
      ${img
        ? `<img class="food-card-img" src="${img}" alt="${p.product_name.replace(/"/g,'&quot;')}" onerror="this.style.display='none'">`
        : `<div class="food-card-img" style="background:var(--surface2)"></div>`}
      <div class="food-card-body">
        <div class="food-card-name">${p.product_name}</div>
        ${p.brands ? `<div class="food-card-brand">${p.brands.split(',')[0]}</div>` : ''}
        <div class="food-card-macros">
          <span class="macro-badge" style="background:${mc.calories}">${n.calories} kcal</span>
          <span class="macro-badge" style="background:${mc.protein}">${n.protein}g P</span>
          <span class="macro-badge" style="background:${mc.carbs}">${n.carbs}g C</span>
          <span class="macro-badge" style="background:${mc.fat}">${n.fat}g F</span>
        </div>
      </div>
      ${score ? `<div class="nutri-score" style="background:${scoreColor}" title="Nutri-Score ${score}">${score}</div>` : ''}
    </div>`;
  }).join('');
}

// ── Modal ─────────────────────────────────────────────────────
let _currentProduct = null;

const _DEFAULT_MACRO_COLORS    = { calories:'#3b82f6', protein:'#10b981', carbs:'#f59e0b', fat:'#ef4444', fiber:'#8b5cf6', sugar:'#ec4899' };
const _DEFAULT_NUTRISCORE_COLORS = { A:'#038141', B:'#85BB2F', C:'#FECB02', D:'#EE8100', E:'#E63E11' };

function _mc()  { return CONFIG.macroColors      || _DEFAULT_MACRO_COLORS; }
function _nsc() { return CONFIG.nutriScoreColors  || _DEFAULT_NUTRISCORE_COLORS; }
function _defaultServing() {
  return (CONFIG.config && CONFIG.config.ui && CONFIG.config.ui.defaultServing_g) || 100;
}

function openModal(p) {
  _currentProduct = p;
  const score = (p.nutriscore_grade || '').toUpperCase();
  const scoreColor = _nsc()[score] || '#aaa';

  document.getElementById('modal-title').textContent = p.product_name;
  document.getElementById('modal-brand').textContent = p.brands ? p.brands.split(',')[0] : '';
  document.getElementById('modal-score').style.background = score ? scoreColor : 'transparent';
  document.getElementById('modal-score').textContent = score || '';

  document.getElementById('serving-input').value = _defaultServing();
  updateModalNutrients(_defaultServing());

  document.getElementById('modal-overlay').classList.add('open');
}

function updateModalNutrients(serving) {
  if (!_currentProduct) return;
  const n  = getNutrients(_currentProduct, serving);
  const mc = _mc();
  document.getElementById('modal-nutrients').innerHTML = `
    <div class="nutrient-tile"><div class="value" style="color:${mc.calories}">${n.calories}</div><div class="label">Calories (kcal)</div></div>
    <div class="nutrient-tile"><div class="value" style="color:${mc.protein}">${n.protein}g</div><div class="label">Protein</div></div>
    <div class="nutrient-tile"><div class="value" style="color:${mc.carbs}">${n.carbs}g</div><div class="label">Carbs</div></div>
    <div class="nutrient-tile"><div class="value" style="color:${mc.fat}">${n.fat}g</div><div class="label">Fat</div></div>
    <div class="nutrient-tile"><div class="value" style="color:${mc.fiber}">${n.fiber}g</div><div class="label">Fiber</div></div>
    <div class="nutrient-tile"><div class="value" style="color:${mc.sugar}">${n.sugar}g</div><div class="label">Sugar</div></div>
  `;
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  _currentProduct = null;
}

function addFromModal() {
  if (!_currentProduct) return;
  const serving = parseFloat(document.getElementById('serving-input').value) || 100;
  const n = getNutrients(_currentProduct, serving);
  addToLog({
    name: _currentProduct.product_name,
    serving,
    ...n
  });
  closeModal();
}

// ── Tracker ───────────────────────────────────────────────────
function getDailyTotals() {
  const totals = getMealLog().reduce((acc, item) => {
    acc.calories += item.calories || 0;
    acc.protein  += item.protein  || 0;
    acc.carbs    += item.carbs    || 0;
    acc.fat      += item.fat      || 0;
    acc.fiber    += item.fiber    || 0;
    acc.sugar    += item.sugar    || 0;
    return acc;
  }, { calories:0, protein:0, carbs:0, fat:0, fiber:0, sugar:0 });
  // Expose totals globally so Watson pre:send can pass them to Granite
  window._nutritionTotals = totals;
  return totals;
}

function renderTracker() {
  const totals = getDailyTotals();
  const mc = CONFIG.macroColors || {};
  const macros = [
    { key: 'calories', label: 'Calories', unit: 'kcal', goal: goals.calories,    color: mc.calories },
    { key: 'protein',  label: 'Protein',  unit: 'g',    goal: goals.protein_g,   color: mc.protein  },
    { key: 'carbs',    label: 'Carbs',    unit: 'g',    goal: goals.carbs_g,     color: mc.carbs    },
    { key: 'fat',      label: 'Fat',      unit: 'g',    goal: goals.fat_g,       color: mc.fat      },
    { key: 'fiber',    label: 'Fiber',    unit: 'g',    goal: goals.fiber_g,     color: mc.fiber    },
    { key: 'sugar',    label: 'Sugar',    unit: 'g',    goal: goals.sugar_g,     color: mc.sugar    },
  ];

  document.getElementById('tracker-content').innerHTML = macros.map(m => {
    const val   = Math.round(totals[m.key] * 10) / 10;
    const pct   = Math.min(100, Math.round((val / m.goal) * 100));
    const over  = val > m.goal;
    const fill  = over ? '#ef4444' : m.color;
    return `
    <div class="tracker-macro">
      <div class="tracker-macro-header">
        <span class="name">${m.label}</span>
        <span class="values" style="color:${over ? '#ef4444' : 'var(--muted)'}">
          ${val} / ${m.goal} ${m.unit} (${pct}%)
        </span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%;background:${fill}"></div>
      </div>
    </div>`;
  }).join('');
}

// ── Meal Log Render ───────────────────────────────────────────
function renderMealLog() {
  const log = getMealLog();
  const el  = document.getElementById('meal-log-list');
  if (!log.length) {
    el.innerHTML = '<p class="empty-state">No meals logged yet.<br>Search and add food above.</p>';
  } else {
    el.innerHTML = log.map(item => `
      <div class="meal-item">
        <span class="meal-item-name" title="${item.name}">${item.name}</span>
        <span class="meal-item-cal">${item.serving}g · ${item.calories} kcal</span>
        <button class="remove-btn" onclick="removeFromLog(${item.id})" title="Remove">✕</button>
      </div>
    `).join('');
  }
  renderMealSuggestions();
}

// ── What to Eat Suggestions ───────────────────────────────────
function renderMealSuggestions() {
  const el = document.getElementById('meal-suggestions');
  if (!el) return;

  const totals   = getDailyTotals();
  const remCal   = Math.max(0, goals.calories   - totals.calories);
  const remProt  = Math.max(0, goals.protein_g  - totals.protein);
  const remCarbs = Math.max(0, goals.carbs_g    - totals.carbs);
  const remFat   = Math.max(0, goals.fat_g      - totals.fat);
  const remFiber = Math.max(0, goals.fiber_g    - totals.fiber);

  // Nothing remaining — all goals met
  if (remCal === 0 && remProt === 0 && remFiber === 0) {
    el.innerHTML = `
      <div class="suggestions-header">✅ What to Eat Next</div>
      <div class="tip success" style="margin:0">You've hit all your daily goals! Great job — stay hydrated and rest well. 💧</div>`;
    return;
  }

  // Build a ranked list of suggestions based on biggest remaining deficits
  const suggestions = [];

  if (remProt > 10) {
    suggestions.push({
      icon: '🥚',
      label: 'High-Protein Foods',
      reason: `${Math.round(remProt)}g protein remaining`,
      foods: ['Eggs', 'Chicken breast', 'Greek yoghurt', 'Lentils', 'Tuna', 'Cottage cheese'],
      color: '#10b981',
    });
  }

  if (remFiber > 5) {
    suggestions.push({
      icon: '🥦',
      label: 'High-Fibre Foods',
      reason: `${Math.round(remFiber)}g fibre remaining`,
      foods: ['Oats', 'Broccoli', 'Chickpeas', 'Apples', 'Whole wheat bread', 'Avocado'],
      color: '#8b5cf6',
    });
  }

  if (remCarbs > 30 && remCal > 150) {
    suggestions.push({
      icon: '🍚',
      label: 'Healthy Carbs',
      reason: `${Math.round(remCarbs)}g carbs remaining`,
      foods: ['Brown rice', 'Sweet potato', 'Banana', 'Whole oats', 'Quinoa', 'Whole-grain pasta'],
      color: '#f59e0b',
    });
  }

  if (remFat > 10 && remCal > 100) {
    suggestions.push({
      icon: '🥑',
      label: 'Healthy Fats',
      reason: `${Math.round(remFat)}g fat remaining`,
      foods: ['Avocado', 'Almonds', 'Walnuts', 'Olive oil', 'Peanut butter', 'Salmon'],
      color: '#ef4444',
    });
  }

  // Generic low-calorie top-up when calories remain but macros are balanced
  if (suggestions.length === 0 && remCal > 100) {
    suggestions.push({
      icon: '🍽️',
      label: 'Light Options',
      reason: `${Math.round(remCal)} kcal remaining`,
      foods: ['Mixed salad', 'Fruit bowl', 'Vegetable soup', 'Rice cakes', 'Hummus & veggies', 'Low-fat yoghurt'],
      color: '#3b82f6',
    });
  }

  if (!suggestions.length) {
    el.innerHTML = '';
    return;
  }

  el.innerHTML = `
    <div class="suggestions-header">🍽️ What to Eat Next</div>
    ${suggestions.map(s => `
      <div class="suggestion-item">
        <div class="suggestion-top">
          <span class="suggestion-icon">${s.icon}</span>
          <div class="suggestion-meta">
            <span class="suggestion-label" style="color:${s.color}">${s.label}</span>
            <span class="suggestion-reason">${s.reason}</span>
          </div>
        </div>
        <div class="suggestion-foods">
          ${s.foods.map(f => `<span class="suggestion-food-tag">${f}</span>`).join('')}
        </div>
      </div>
    `).join('')}`;
}

// ── Tips ──────────────────────────────────────────────────────
function renderTips() {
  const totals = getDailyTotals();
  const tips   = [];

  if (!getMealLog().length) {
    tips.push({ type: 'info', msg: '👋 Search for a food item above and add it to your daily log to get started.' });
  } else {
    const calPct = totals.calories / goals.calories;
    if (calPct >= 1.1)      tips.push({ type: 'danger', msg: `🔥 You've exceeded your daily calorie goal by ${Math.round(totals.calories - goals.calories)} kcal. Consider lighter options.` });
    else if (calPct >= 0.9) tips.push({ type: 'warn',   msg: `⚠️ You're close to your daily calorie limit (${Math.round(totals.calories)} / ${goals.calories} kcal).` });
    else                    tips.push({ type: 'success', msg: `✅ Calorie intake looks good — ${Math.round(goals.calories - totals.calories)} kcal remaining today.` });

    if (totals.protein < goals.protein_g * 0.5) tips.push({ type: 'warn', msg: `💪 Protein is low (${totals.protein}g). Add eggs, legumes, meat, or dairy.` });
    if (totals.fiber   < goals.fiber_g   * 0.5) tips.push({ type: 'info', msg: `🌾 Fiber is low (${totals.fiber}g). Try whole grains, fruits, or vegetables.` });
    if (totals.sugar   > goals.sugar_g)          tips.push({ type: 'danger', msg: `🍬 Sugar exceeds goal (${totals.sugar}g / ${goals.sugar_g}g). Watch out for sweetened foods.` });
  }

  document.getElementById('tips-content').innerHTML = tips.map(t =>
    `<div class="tip ${t.type}">${t.msg}</div>`
  ).join('');
}

// ── Goals Editor ─────────────────────────────────────────────
function toggleGoals() {
  const panel = document.getElementById('goals-panel');
  const isHidden = panel.style.display === 'none' || !panel.style.display;
  panel.style.display = isHidden ? 'block' : 'none';
  if (isHidden) renderGoalsForm();
}

function renderGoalsForm() {
  const fields = [
    { key: 'calories', label: 'Calories (kcal)' },
    { key: 'protein_g', label: 'Protein (g)' },
    { key: 'carbs_g',   label: 'Carbs (g)' },
    { key: 'fat_g',     label: 'Fat (g)' },
    { key: 'fiber_g',   label: 'Fiber (g)' },
    { key: 'sugar_g',   label: 'Sugar (g)' },
  ];
  document.getElementById('goals-form').innerHTML = `
    <div class="goals-grid">
      ${fields.map(f => `
        <div class="goals-field">
          <label>${f.label}</label>
          <input type="number" id="goal-${f.key}" value="${goals[f.key]}" min="0">
        </div>`).join('')}
    </div>
    <button class="btn btn-primary btn-sm w-full" onclick="saveGoals()">Save Goals</button>
  `;
}

function saveGoals() {
  ['calories','protein_g','carbs_g','fat_g','fiber_g','sugar_g'].forEach(k => {
    const el = document.getElementById(`goal-${k}`);
    if (el) goals[k] = parseFloat(el.value) || goals[k];
  });
  localStorage.setItem(CONFIG.config.storage.goalsKey, JSON.stringify(goals));
  renderTracker();
  renderTips();
  document.getElementById('goals-panel').style.display = 'none';
  showToast('✅ Goals saved');
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), CONFIG.config?.ui?.toastDuration_ms || 3000);
}

// ── Search Handler ────────────────────────────────────────────
async function handleSearch() {
  const q = document.getElementById('search-input').value.trim();
  if (!q) return;

  const container = document.getElementById('search-results');
  container.innerHTML = `<div class="loader"><div class="spinner"></div><br>Searching Open Food Facts…</div>`;

  document.getElementById('search-btn').disabled = true;
  try {
    const products = await searchFood(q);
    renderResults(products);
  } catch (e) {
    container.innerHTML = `<p class="empty-state" style="color:var(--red)">⚠️ Search failed. Check your connection and try again.</p>`;
  } finally {
    document.getElementById('search-btn').disabled = false;
  }
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();

  document.getElementById('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSearch();
  });

  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  document.getElementById('feature-modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('feature-modal-overlay')) closeFeatureModal();
  });

  document.getElementById('serving-input').addEventListener('input', e => {
    updateModalNutrients(parseFloat(e.target.value) || 100);
  });
})