import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { starterRecipes } from "./data.js";

const FoodContext = createContext(null);
const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const SUPER_ADMIN = { name: "Super Admin", email: "manikantamani8034@kluniversity.in", password: "superadmin123", role: "superadmin" };

function FoodProvider({ children }) {
  const [recipes, setRecipes] = useState(() => {
    const saved = read("foodRecipes", null);
    const source = Array.isArray(saved) ? saved : starterRecipes;
    // Remove the old Vegetable Biryani card if it was left in the browser's saved data.
    return source.filter(recipe =>
      recipe.id !== "vegetable-biryani" &&
      recipe.name?.toLowerCase() !== "vegetable biryani"
    );
  });
  const [favorites, setFavorites] = useState(() => read("favorites", []));
  useEffect(() => write("foodRecipes", recipes), [recipes]);
  useEffect(() => write("favorites", favorites), [favorites]);

  const toggleFavorite = id => setFavorites(old =>
    old.includes(id) ? old.filter(item => item !== id) : [...old, id]
  );

  const addLoginEvent = (account, role) => {
    const logs = read("loginHistory", []);
    logs.push({ email: account.email, name: account.name || account.email, role, time: new Date().toISOString() });
    write("loginHistory", logs);
    const sessions = read("activeSessions", []);
    write("activeSessions", [
      ...sessions.filter(s => !(s.email.toLowerCase() === account.email.toLowerCase() && s.role === role)),
      { email: account.email, name: account.name || account.email, role, lastSeen: new Date().toISOString() }
    ]);
  };

  const value = useMemo(() => ({
    recipes, setRecipes, favorites, toggleFavorite, addLoginEvent
  }), [recipes, favorites]);

  return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>;
}
const useFood = () => useContext(FoodContext);

function Header({ auth = false }) {
  const navigate = useNavigate();
  const loggedIn = localStorage.getItem("userLoggedIn") === "true";
  const currentUser = read("currentUser", {});
  return <header className="navbar">
    <NavLink to={auth ? "/" : (loggedIn ? "/home" : "/")} className="brand">
      <img src="/logo.png" alt="Food Recipe logo" />
    </NavLink>
    <nav>
      <NavLink to={loggedIn ? "/home" : "/"}>Home</NavLink>
      <NavLink to="/recipes">Recipes</NavLink>
      <NavLink to="/cuisines">Cuisines</NavLink>
      {loggedIn && <NavLink to="/favorites">Favorites</NavLink>}
    </nav>
    {loggedIn
      ? <div className="nav-actions">
          <button className="profile" title="Profile" onClick={() => alert(`Signed in as ${currentUser.name || currentUser.email}`)}>♙</button>
          <button className="btn" onClick={() => {
            localStorage.removeItem("userLoggedIn");
            localStorage.removeItem("currentUser");
            write("activeSessions", read("activeSessions", []).filter(s => s.role !== "user" || s.email !== currentUser.email));
            navigate("/");
          }}>Logout</button>
        </div>
      : <button className="outline-btn" onClick={() => navigate("/")}>← Login</button>}
  </header>;
}
function Page({ children }) {
  return <><Header />{children}<footer>© 2026 Food Recipe. Discover · Cook · Enjoy.</footer></>;
}
function AdminHeader({ superAdmin = false }) {
  const navigate = useNavigate();
  const key = superAdmin ? "superAdminLoggedIn" : "adminLoggedIn";
  const title = superAdmin ? "Super Admin" : (read("currentAdmin", {}).name || "Chef Admin");
  return <header className="navbar admin-navbar">
    <NavLink to={superAdmin ? "/super-admin/dashboard" : "/admin/dashboard"} className="brand"><img src="/logo.png" alt="Food Recipe logo" /></NavLink>
    <nav><span className="nav-role">{superAdmin ? "SUPER ADMIN PANEL" : "CHEF / ADMIN PANEL"}</span></nav>
    <div className="nav-actions"><span className="admin-welcome">{title}</span><button className="btn" onClick={() => {
      const current = superAdmin ? read("currentSuperAdmin", {}) : read("currentAdmin", {});
      localStorage.removeItem(key);
      if (superAdmin) localStorage.removeItem("currentSuperAdmin");
      else localStorage.removeItem("currentAdmin");
      write("activeSessions", read("activeSessions", []).filter(s => s.email !== current.email));
      navigate(superAdmin ? "/super-admin/login" : "/admin/login");
    }}>Logout</button></div>
  </header>;
}
function AuthShell({ title, subtitle, children }) {
  return <div className="auth-page"><Header auth /><main className="auth-wrap"><div className="auth-card">
    <img className="auth-logo" src="/logo.png" alt="Food Recipe" />
    <h1>{title}</h1><p className="muted center">{subtitle}</p>{children}
  </div></main></div>;
}
function Login() {
  const { addLoginEvent } = useFood();
  const navigate = useNavigate();
  const [email, setEmail] = useState(read("rememberedEmail", ""));
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(Boolean(read("rememberedEmail", "")));
  const [error, setError] = useState("");
  function submit(e) {
    e.preventDefault(); setError("");
    const users = read("users", []);
    const legacyUser = read("user", null);
    const user = users.find(item => item.email.toLowerCase() === email.trim().toLowerCase()) ||
      (legacyUser && legacyUser.email.toLowerCase() === email.trim().toLowerCase() ? legacyUser : null);
    if (!user) return setError("Account not found. Please create an account first.");
    if (user.password !== password) return setError("Incorrect password.");
    localStorage.setItem("userLoggedIn", "true");
    write("currentUser", user);
    addLoginEvent(user, "user");
    if (remember) localStorage.setItem("rememberedEmail", email.trim());
    else localStorage.removeItem("rememberedEmail");
    navigate("/home");
  }
  return <AuthShell title="Welcome Back!" subtitle="Login to discover delicious recipes.">
    <form onSubmit={submit}>
      {error && <p className="notice error">{error}</p>}
      <label>Email Address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required /></label>
      <div className="form-row"><label className="check"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Remember me</label><span className="link" onClick={() => alert("Use the password you registered with in this Local Storage demo.")}>Forgot Password?</span></div>
      <button className="btn full">Login →</button>
      <p className="center muted">Don't have an account? <NavLink className="link" to="/signup">Create Account</NavLink></p>
      <hr />
      <p className="center"><NavLink className="admin-link" to="/admin/login">👨‍🍳 Chef / Admin Login</NavLink></p>
      <p className="center tiny"><NavLink className="link" to="/super-admin/login">Super Admin Login</NavLink></p>
    </form>
  </AuthShell>;
}
function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  function submit(e) {
    e.preventDefault(); setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 6) return setError("Password must contain at least 6 characters.");
    const users = read("users", []);
    if (users.some(user => user.email.toLowerCase() === form.email.trim().toLowerCase())) return setError("An account with this email already exists.");
    const user = { name: form.name.trim(), email: form.email.trim(), password: form.password, createdAt: new Date().toISOString(), role: "user" };
    write("users", [...users, user]);
    localStorage.setItem("user", JSON.stringify(user));
    navigate("/");
  }
  return <AuthShell title="Create Account" subtitle="Join Food Recipe and discover delicious meals.">
    <form onSubmit={submit}>
      {error && <p className="notice error">{error}</p>}
      <label>Full Name<input name="name" value={form.name} onChange={change} required placeholder="Enter your name" /></label>
      <label>Email Address<input name="email" type="email" value={form.email} onChange={change} required placeholder="Enter your email" /></label>
      <label>Password<input name="password" type="password" value={form.password} onChange={change} required placeholder="Create a password" /></label>
      <label>Confirm Password<input name="confirm" type="password" value={form.confirm} onChange={change} required placeholder="Confirm your password" /></label>
      <button className="btn full">Create Account</button>
      <p className="center muted">Already have an account? <NavLink className="link" to="/">Login</NavLink></p>
    </form>
  </AuthShell>;
}
function Home() {
  const { recipes } = useFood();
  return <Page>
    <section className="hero"><div><span className="eyebrow">WELCOME TO FOOD RECIPE</span><h1>Discover delicious recipes <em>for every moment.</em></h1><p>Find inspiration, explore world cuisines, and enjoy simple cooking guides made for your kitchen.</p><div className="hero-actions"><NavLink className="btn" to="/recipes">Explore Recipes →</NavLink><NavLink className="outline-orange" to="/cuisines">Explore Cuisines</NavLink></div></div><img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200" alt="Healthy food bowl" /></section>
    <section className="section"><div className="section-heading"><span className="eyebrow">FRESH IDEAS</span><h2>Popular Recipes</h2></div><RecipeGrid items={recipes.slice(0, 3)} /></section>
  </Page>;
}
function RecipeGrid({ items }) {
  const { favorites, toggleFavorite } = useFood();
  const navigate = useNavigate();
  if (!items.length) return <p className="empty">No recipes found. Try another search or filter.</p>;
  return <div className="recipe-grid">{items.map(r => <article className="recipe-card" key={r.id}>
    <img src={r.image} alt={r.name} onError={e => { e.currentTarget.src = "https://placehold.co/800x500/fff1dd/f58200?text=Food+Recipe"; }} />
    <div className="recipe-body"><span className="tag">{r.cuisine}</span><h3>{r.name}</h3><p>{r.description}</p><div className="meta">⏱ {r.time} <span>•</span> {r.difficulty}</div>
      <div className="card-actions"><button className="btn small" onClick={() => navigate(`/recipes/${r.id}`)}>View Recipe →</button><button className={`heart ${favorites.includes(r.id) ? "active" : ""}`} onClick={() => toggleFavorite(r.id)} aria-label="Toggle favorite">{favorites.includes(r.id) ? "♥" : "♡"}</button></div>
    </div>
  </article>)}</div>;
}
function Recipes({ favoritesOnly = false }) {
  const { recipes, favorites } = useFood();
  const [search, setSearch] = useState("");
  const [params] = useSearchParams();
  const initialCuisine = params.get("cuisine") || "All";
  const [cuisine, setCuisine] = useState(initialCuisine);
  const items = recipes.filter(r =>
    (!favoritesOnly || favorites.includes(r.id)) &&
    (cuisine === "All" || r.cuisine === cuisine) &&
    `${r.name} ${r.description}`.toLowerCase().includes(search.toLowerCase())
  );
  return <Page><main className="section listing">
    <div className="section-heading"><span className="eyebrow">FIND YOUR NEXT FAVORITE</span><h1>{favoritesOnly ? "My Favorite Recipes" : "Explore Recipes"}</h1><p className="muted">{items.length} recipes</p></div>
    <input className="search" placeholder="Search recipes..." value={search} onChange={e => setSearch(e.target.value)} />
    <div className="filters">{["All", "Indian", "Italian", "Chinese", "Healthy"].map(c => <button key={c} className={`filter ${cuisine === c ? "selected" : ""}`} onClick={() => setCuisine(c)}>{c}</button>)}</div>
    <RecipeGrid items={items} />
  </main></Page>;
}
function Cuisines() {
  const navigate = useNavigate();
  const categories = [{ name: "Indian", emoji: "🍛", text: "Rich spices and comforting classics" }, { name: "Italian", emoji: "🍝", text: "Pasta, herbs and homestyle favorites" }, { name: "Chinese", emoji: "🥡", text: "Fresh, quick and flavorful dishes" }, { name: "Healthy", emoji: "🥗", text: "Fresh ideas for balanced meals" }];
  return <Page><main className="section listing"><div className="section-heading"><span className="eyebrow">EXPLORE THE WORLD</span><h1>Explore World Cuisines</h1><p className="muted">Choose a cuisine to discover recipes.</p></div><div className="cuisine-grid">{categories.map(c => <button className="cuisine-card" key={c.name} onClick={() => navigate(`/recipes?cuisine=${c.name}`)}><span>{c.emoji}</span><h2>{c.name}</h2><p>{c.text}</p><b>Explore Recipes →</b></button>)}</div></main></Page>;
}
function RecipeDetails() {
  const { id } = useParams();
  const { recipes, favorites, toggleFavorite } = useFood();
  const recipe = recipes.find(r => r.id === id);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!recipe) return;
    const views = read("recipeViews", {});
    write("recipeViews", { ...views, [recipe.id]: (views[recipe.id] || 0) + 1 });
  }, [id]);
  if (!recipe) return <Page><main className="section"><h2>Recipe not found</h2><NavLink className="link" to="/recipes">Back to recipes</NavLink></main></Page>;
  const saved = favorites.includes(recipe.id);
  const allRatings = read("recipeRatings", []);
  const recipeRatings = allRatings.filter(item => item.recipeId === recipe.id);
  const average = recipeRatings.length ? (recipeRatings.reduce((sum, item) => sum + item.rating, 0) / recipeRatings.length).toFixed(1) : "Not rated yet";
  function submitRating(e) {
    e.preventDefault();
    if (!rating) return setMessage("Please select a star rating.");
    const user = read("currentUser", {});
    const entry = { id: `rating-${Date.now()}`, recipeId: recipe.id, recipeName: recipe.name, rating, comment: comment.trim(), userName: user.name || user.email || "Guest", userEmail: user.email || "guest", createdAt: new Date().toISOString() };
    write("recipeRatings", [...allRatings, entry]);
    setRating(0); setComment(""); setMessage("Thank you! Your rating has been submitted.");
  }
  return <Page><main className="section">
    <NavLink className="link" to="/recipes">← Back to Recipes</NavLink>
    <section className="detail-card"><img src={recipe.image} alt={recipe.name} onError={e => { e.currentTarget.src = "https://placehold.co/800x500/fff1dd/f58200?text=Food+Recipe"; }} /><div><span className="tag">{recipe.cuisine}</span><h1>{recipe.name}</h1><p className="muted">{recipe.description}</p><div className="meta">⏱ {recipe.time}　•　{recipe.difficulty}　•　4 servings</div><p className="rating-summary">⭐ {average} <span>({recipeRatings.length} ratings)</span></p><button className="outline-orange favorite-detail" onClick={() => toggleFavorite(recipe.id)}>{saved ? "♥ Added to Favorites" : "♡ Add to Favorites"}</button></div></section>
    <div className="detail-columns"><section className="detail-box"><h2>Ingredients</h2><ul>{(recipe.ingredients || []).map(x => <li key={x}>{x}</li>)}</ul></section><section className="detail-box"><h2>Cooking Instructions</h2><ol>{(recipe.instructions || []).map(x => <li key={x}>{x}</li>)}</ol></section></div>
    <section className="detail-box rating-box"><h2>Rate this Recipe</h2><p className="muted">Share your experience with this dish.</p><form onSubmit={submitRating}><div className="star-picker" aria-label="Choose rating">{[1,2,3,4,5].map(n => <button type="button" key={n} className={n <= rating ? "star chosen" : "star"} onClick={() => setRating(n)}>★</button>)}</div><textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Write a short review (optional)" rows="3" /><button className="btn">Submit Rating</button>{message && <p className="notice success">{message}</p>}</form></section>
    <section className="detail-box"><h2>User Reviews</h2>{recipeRatings.length ? recipeRatings.map(item => <div className="review-row" key={item.id}><b>{item.userName}</b><span className="review-stars">{"★".repeat(item.rating)}{"☆".repeat(5-item.rating)}</span><p>{item.comment || "Rated this recipe."}</p></div>) : <p className="muted">No ratings yet. Be the first to rate this recipe.</p>}</section>
  </main></Page>;
}

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  function submit(e) {
    e.preventDefault(); setError("");
    const admins = read("admins", []);
    const oldAdmin = read("adminUser", null);
    const admin = admins.find(item => item.email.toLowerCase() === email.trim().toLowerCase()) ||
      (oldAdmin && oldAdmin.email.toLowerCase() === email.trim().toLowerCase() ? oldAdmin : null);
    if (!admin || admin.password !== password) return setError("Invalid chef/admin email or password.");
    const account = { ...admin, role: "admin" };
    localStorage.setItem("adminLoggedIn", "true");
    write("currentAdmin", account);
    const logs = read("adminLoginHistory", []);
    write("adminLoginHistory", [...logs, { email: account.email, name: account.name || account.email, time: new Date().toISOString() }]);
    const sessions = read("activeSessions", []);
    write("activeSessions", [...sessions.filter(s => s.email !== account.email), { email: account.email, name: account.name || account.email, role: "admin", lastSeen: new Date().toISOString() }]);
    navigate("/admin/dashboard");
  }
  return <AuthShell title="Chef / Admin Login" subtitle="Sign in to add and manage your recipes.">
    <form onSubmit={submit}>{error && <p className="notice error">{error}</p>}
      <label>Admin Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter admin email" required /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required /></label>
      <button className="btn full">Admin Login →</button>
      <p className="center muted">New chef/admin? <NavLink className="link" to="/admin/signup">Register as Admin</NavLink></p>
      <hr /><p className="center tiny"><NavLink className="link" to="/super-admin/login">Super Admin Login →</NavLink></p>
    </form>
  </AuthShell>;
}
function AdminSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", specialty: "Admin" });
  const [error, setError] = useState("");
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  function submit(e) {
    e.preventDefault(); setError("");
    if (form.password.length < 6) return setError("Password must contain at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    const admins = read("admins", []);
    if (admins.some(item => item.email.toLowerCase() === form.email.trim().toLowerCase())) return setError("An admin account with this email already exists.");
    const account = { name: form.name.trim(), email: form.email.trim(), password: form.password, specialty: form.specialty, role: "admin", createdAt: new Date().toISOString() };
    write("admins", [...admins, account]);
    navigate("/admin/login");
  }
  return <AuthShell title="Chef / Admin Registration" subtitle="Register as a recipe creator to add dishes and track their performance.">
    <form onSubmit={submit}>{error && <p className="notice error">{error}</p>}
      <label>Full Name<input name="name" value={form.name} onChange={change} placeholder="Enter your name" required /></label>
      <label>Admin Email<input name="email" type="email" value={form.email} onChange={change} placeholder="Enter your email" required /></label>
      <label>Chef / Admin Type<select name="specialty" value={form.specialty} onChange={change}><option>Admin</option><option>Super Admin</option></select></label>
      <label>Password<input name="password" type="password" value={form.password} onChange={change} placeholder="Create a password" required /></label>
      <label>Confirm Password<input name="confirm" type="password" value={form.confirm} onChange={change} placeholder="Confirm password" required /></label>
      <button className="btn full">Create Admin Account</button>
      <p className="center muted">Already registered? <NavLink className="link" to="/admin/login">Admin Login</NavLink></p>
    </form>
  </AuthShell>;
}
function AdminDashboard() {
  const { recipes, setRecipes } = useFood();
  const navigate = useNavigate();
  const admin = read("currentAdmin", {});
  const [form, setForm] = useState({ name: "", cuisine: "Indian", time: "30 mins", difficulty: "Easy", image: "", description: "", ingredients: "", instructions: "" });
  const [message, setMessage] = useState("");
  if (localStorage.getItem("adminLoggedIn") !== "true") return <Navigate to="/admin/login" replace />;
  const ownRecipes = recipes.filter(r => r.createdBy === admin.email);
  const views = read("recipeViews", {});
  const ratings = read("recipeRatings", []);
  function add(e) {
    e.preventDefault();
    const newRecipe = {
      id: `recipe-${Date.now()}`, name: form.name.trim(), cuisine: form.cuisine, time: form.time,
      difficulty: form.difficulty, image: form.image || "https://placehold.co/800x500/fff1dd/f58200?text=Food+Recipe",
      description: form.description || "A delicious recipe to try.",
      ingredients: form.ingredients.split("\n").map(x => x.trim()).filter(Boolean),
      instructions: form.instructions.split("\n").map(x => x.trim()).filter(Boolean),
      createdBy: admin.email, createdByName: admin.name || admin.email
    };
    setRecipes(old => [...old, newRecipe]);
    setForm({ name: "", cuisine: "Indian", time: "30 mins", difficulty: "Easy", image: "", description: "", ingredients: "", instructions: "" });
    setMessage("Recipe added successfully.");
  }
  return <div className="dashboard-page"><AdminHeader /><main className="section listing">
    <div className="admin-head"><div><span className="eyebrow">CHEF / ADMIN WORKSPACE</span><h1>Welcome, {admin.name || "Chef"}!</h1><p className="muted">Add recipes and monitor views and ratings for your dishes.</p></div></div>
    <div className="stats-grid">
      <StatCard label="My Recipes" value={ownRecipes.length} icon="🍽️" />
      <StatCard label="Total Views" value={ownRecipes.reduce((sum, r) => sum + (views[r.id] || 0), 0)} icon="👀" />
      <StatCard label="Total Ratings" value={ratings.filter(a => ownRecipes.some(r => r.id === a.recipeId)).length} icon="⭐" />
    </div>
    <form className="admin-form" onSubmit={add}><h2>Add a New Food Recipe</h2><div className="admin-fields">
      <input placeholder="Recipe name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
      <select value={form.cuisine} onChange={e => setForm({ ...form, cuisine: e.target.value })}><option>Indian</option><option>Italian</option><option>Chinese</option><option>Healthy</option></select>
      <input placeholder="Cooking time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required />
      <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}><option>Easy</option><option>Medium</option><option>Hard</option></select>
      <input placeholder="Image URL" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
      <input placeholder="Short description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <textarea placeholder="Ingredients (one per line)" value={form.ingredients} onChange={e => setForm({ ...form, ingredients: e.target.value })} />
      <textarea placeholder="Cooking instructions (one per line)" value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} />
      <button className="btn">Add Recipe</button>
    </div>{message && <p className="notice success">{message}</p>}</form>
    <h2>My Recipe Performance</h2>
    {ownRecipes.length ? <div className="performance-list">{ownRecipes.map(recipe => {
      const list = ratings.filter(r => r.recipeId === recipe.id);
      const avg = list.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : "—";
      return <article className="performance-card" key={recipe.id}><img src={recipe.image} alt={recipe.name} onError={e => { e.currentTarget.src = "https://placehold.co/160x120/fff1dd/f58200?text=Food"; }} /><div className="performance-main"><h3>{recipe.name}</h3><p className="muted">{recipe.cuisine} · {recipe.time}</p><div className="performance-metrics"><span>👀 {views[recipe.id] || 0} views</span><span>⭐ {avg} ({list.length} ratings)</span></div>{list.slice().reverse().map(r => <p className="review-mini" key={r.id}><b>{r.userName}</b> · {"★".repeat(r.rating)}{"☆".repeat(5-r.rating)} — {r.comment}</p>)}</div><button className="delete-btn" onClick={() => setRecipes(old => old.filter(item => item.id !== recipe.id))}>Delete</button></article>;
    })}</div> : <p className="empty">You have not added any recipes yet. Use the form above to add your first dish.</p>}
  </main></div>;
}
function StatCard({ label, value, icon }) {
  return <div className="stat-card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>;
}
function SuperAdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  function submit(e) {
    e.preventDefault(); setError("");
    if (email.trim().toLowerCase() !== SUPER_ADMIN.email || password !== SUPER_ADMIN.password) return setError("Invalid super admin credentials.");
    localStorage.setItem("superAdminLoggedIn", "true");
    write("currentSuperAdmin", SUPER_ADMIN);
    const sessions = read("activeSessions", []);
    write("activeSessions", [...sessions.filter(s => s.email !== SUPER_ADMIN.email), { email: SUPER_ADMIN.email, name: SUPER_ADMIN.name, role: "superadmin", lastSeen: new Date().toISOString() }]);
    const logs = read("adminLoginHistory", []);
    write("adminLoginHistory", [...logs, { email: SUPER_ADMIN.email, name: SUPER_ADMIN.name, role: "superadmin", time: new Date().toISOString() }]);
    navigate("/super-admin/dashboard");
  }
  return <AuthShell title="Super Admin Login" subtitle="Platform owner access · View users, admins and recipe feedback.">
    <form onSubmit={submit}>{error && <p className="notice error">{error}</p>}
      <label>Super Admin Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter super admin email" required /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required /></label>
      <button className="btn full">Super Admin Login →</button>
      <p className="demo-credentials">Login: manikantamani8034@kluniversity.in / superadmin123</p>
      <p className="center muted"><NavLink className="link" to="/admin/login">Chef / Admin Login</NavLink></p>
    </form>
  </AuthShell>;
}
function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { recipes } = useFood();
  if (localStorage.getItem("superAdminLoggedIn") !== "true") return <Navigate to="/super-admin/login" replace />;
  const users = read("users", []);
  const admins = read("admins", []);
  const history = read("loginHistory", []);
  const adminHistory = read("adminLoginHistory", []);
  const sessions = read("activeSessions", []);
  const ratings = read("recipeRatings", []);
  const userLogins = history.filter(x => x.role === "user").length;
  const chefLogins = adminHistory.filter(x => x.role !== "superadmin").length;
  const userOnline = sessions.filter(x => x.role === "user").length;
  const adminsOnline = sessions.filter(x => x.role === "admin").length;
  const average = ratings.length ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1) : "—";
  const views = read("recipeViews", {});
  return <div className="dashboard-page"><AdminHeader superAdmin /><main className="section listing">
    <div className="admin-head"><div><span className="eyebrow">PLATFORM CONTROL CENTER</span><h1>Super Admin Dashboard</h1><p className="muted">Monitor platform activity, registered accounts and recipe feedback.</p></div></div>
    <div className="stats-grid">
      <StatCard label="Registered Users" value={users.length || (read("user", null) ? 1 : 0)} icon="👥" />
      <StatCard label="Registered Chefs / Admins" value={admins.length + (read("adminUser", null) && admins.length === 0 ? 1 : 0)} icon="👨‍🍳" />
      <StatCard label="Users Currently Logged In" value={userOnline} icon="🟢" />
      <StatCard label="Admins Currently Logged In" value={adminsOnline} icon="🟢" />
      <StatCard label="Total User Logins" value={userLogins} icon="🔐" />
      <StatCard label="Total Admin Logins" value={chefLogins} icon="📊" />
      <StatCard label="Total Recipes" value={recipes.length} icon="🍽️" />
      <StatCard label="Ratings / Average" value={`${ratings.length} / ${average}`} icon="⭐" />
    </div>
    <section className="admin-form"><h2>Registered Users</h2>{users.length ? <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Registered</th><th>Login Count</th></tr></thead><tbody>{users.map(user => <tr key={user.email}><td>{user.name}</td><td>{user.email}</td><td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td><td>{history.filter(h => h.email === user.email).length}</td></tr>)}</tbody></table></div> : <p className="muted">No registered users yet. User accounts created in this browser will appear here.</p>}</section>
    <section className="admin-form"><h2>Chef / Admin Accounts</h2>{admins.length ? <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Type</th><th>Registered</th></tr></thead><tbody>{admins.map(admin => <tr key={admin.email}><td>{admin.name}</td><td>{admin.email}</td><td>{admin.specialty || "Chef"}</td><td>{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "—"}</td></tr>)}</tbody></table></div> : <p className="muted">No chef/admin accounts registered yet.</p>}</section>
    <section className="admin-form"><h2>Recipe Ratings & Feedback</h2>{ratings.length ? <div className="table-wrap"><table><thead><tr><th>Recipe</th><th>Rating</th><th>User</th><th>Review</th><th>Date</th></tr></thead><tbody>{ratings.slice().reverse().map(item => <tr key={item.id}><td>{item.recipeName}</td><td className="review-stars">{"★".repeat(item.rating)}{"☆".repeat(5-item.rating)}</td><td>{item.userName}</td><td>{item.comment || "—"}</td><td>{new Date(item.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <p className="muted">No user ratings have been submitted yet.</p>}</section>
    <section className="admin-form"><h2>Recipe Engagement</h2><div className="admin-list">{recipes.map(recipe => {
      const list = ratings.filter(r => r.recipeId === recipe.id);
      const avg = list.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : "—";
      return <div key={recipe.id}><span><b>{recipe.name}</b> <small>· {recipe.createdByName || "Starter recipe"}</small></span><span>👀 {views[recipe.id] || 0} views · ⭐ {avg} ({list.length})</span></div>;
    })}</div></section>
  </main></div>;
}
function ProtectedHome() { return localStorage.getItem("userLoggedIn") === "true" ? <Home /> : <Navigate to="/" replace />; }
function ProtectedRecipes({ favoritesOnly = false }) { return localStorage.getItem("userLoggedIn") === "true" ? <Recipes favoritesOnly={favoritesOnly} /> : <Navigate to="/" replace />; }
function ProtectedRecipeDetails() { return localStorage.getItem("userLoggedIn") === "true" ? <RecipeDetails /> : <Navigate to="/" replace />; }

function AppRoutes() {
  return <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/login" element={<Navigate to="/" replace />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/home" element={<ProtectedHome />} />
    <Route path="/recipes" element={<ProtectedRecipes />} />
    <Route path="/recipes/:id" element={<ProtectedRecipeDetails />} />
    <Route path="/favorites" element={<ProtectedRecipes favoritesOnly />} />
    <Route path="/cuisines" element={<Cuisines />} />
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/admin/signup" element={<AdminSignup />} />
    <Route path="/admin/dashboard" element={<AdminDashboard />} />
    <Route path="/super-admin/login" element={<SuperAdminLogin />} />
    <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
export default function App() {
  return <FoodProvider><AppRoutes /></FoodProvider>;
}
