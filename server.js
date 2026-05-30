import express from "express";
import sharp from "sharp";
import cors from 'cors';
import mongoose from "mongoose";
import multer from "multer"
import bcrypt from "bcrypt"
import crypto from "crypto"
import axios from "axios"
import path from 'path'
import { fileURLToPath } from "url";
import 'dotenv/config';

const app = express();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}))

app.use(express.json())

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));


const recipeSchema = new mongoose.Schema({
  name: String,
  country: String,
  city: String,
  description: String,
  ingredients: [{ amount: String, item: String }],
  steps: [String],  
  image: String,
  videoUrl: String,
  cultureNote: String,
}, {timestamps: true });

const Recipe = mongoose.model("Recipe", recipeSchema);

const postSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User"},
  author: {type: String, required: true },
  title: { type: String, required: true},
  content: {type: String, required: true },
  location: {type: String},
  image: {type: String},
  images:[{ url: {type: String, required: true}, caption: String, order: { type: Number, default: 0} }],
  videoUrl: { type: String },
  videoThumbnail: String,
  duration: Number,
  mediaType: { type: String, enum: ['image', 'video', 'gallery'], default: 'image' },
  likes: { type: Number, default: 0 },
  liked: { type: Boolean, default: false },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: { type: Number, default: 0 },
  commentsList: [{ author: String, text: String, createdAt: { type: Date, default: Date.now } }],
  status: { type: String, default: "pending" },
  rejectReason: { type: String },
  tags: [String],
  privacy: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
  mood: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: {type: Date, default: Date.now},
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
})

const Post = mongoose.model("Post", postSchema);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: "" },
  location: {type: String},
  role: {type: String, default: "user"},
  joined: {type: Date, default: Date.now },
  firstLogin: { type: Boolean, default: true },
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
}, {versionKey: false})

const User = mongoose.model("User", userSchema)

const favouriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dishes: [{ _id: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe"}, name: String, country: String, image: String }],
  createdAt: { type: Date, default: Date.now }
})

const Favourite = mongoose.model("Favourite", favouriteSchema);

const tripSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  title: { type: String, required: true },
  description: String,
  countries: [String],
  startDate: Date,
  endDate: Date,
  days: [{
    dayNumber: Number,
    date: Date,
    dishes: [{
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
      name: String,
      country: String,
      city: String,
      image: String,
      price: Number,
      tasted: { type: Boolean, default: false} 
    }]
  }],
  createdAt: { type: Date, default: Date.now }
})

const Trip = mongoose.model("Trip", tripSchema);

const followSchema = new mongoose.Schema({
  followerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  followingId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false, indexes: [{ fields: { followerId: 1, followingId: 1 }, unique: true }] })

const Follow = mongoose.model("Follow", followSchema);

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, enum: ['like', 'comment', 'follow', 'admin_approval', 'admin_reject'] },
  message: { type: String },
  relatedPostId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model("Notification", notificationSchema);

// ... [Recipes API 保持不变] ...

app.post("/api/recipes", async (req, res) => {
  try {
    const newRecipe = new Recipe(req.body);
    await newRecipe.save()
    res.status(201).json(newRecipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.put("/api/recipes/:id", async (req, res) => {
  try {
    const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!updatedRecipe) return res.status(404).json({ error: "Recipe not found" });
    res.json(updatedRecipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.delete("/api/recipes/:id", async (req, res) => {
  try {
    const deleteRecipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!deleteRecipe) return res.status(404).json({ error: "Recipe not found" });
    res.json({ message: "Recipe deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get("/api/recipes", async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/recipes/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get("/api/recipes/by-country/:country", async (req, res) => {
  try {
    const country = req.params.country;
    const recipes = await Recipe.find({ country: new RegExp(`^${country}$`, "i") });
    res.json(Array.isArray(recipes) ? recipes : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get("/api/countries", async (req, res) => {
  try {
    const countries = await Recipe.distinct("country");
    const validCountries = countries.filter(c => c && c.trim()).sort((a, b) => a.localeCompare(b));
    res.json(validCountries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get("/api/recipes/by-countries", async (req, res) => {
  try {
    const countries = req.query.countries;
    const countryList = Array.isArray(countries) ? countries : (countries ? countries.split(',') : []);
    const query = countryList.length > 0 ? { country: { $in: countryList.map(c => new RegExp(`^${c}$`, 'i')) }} : {};
    const recipes = await Recipe.find(query);
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/favourites/:userId", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    const favourite = await Favourite.findOne({ userId });
    res.json(favourite || { dishes: [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/favourites/:userId", async (req, res) => {
  try {
    const userId =  new mongoose.Types.ObjectId(req.params.userId);
    const { dish } = req.body;
    if (!dish?._id) return res.status(400).json({ error: "Dish _id is required" });
    
    let favourite = await Favourite.findOne({ userId });
    if (favourite) {
      const exists = favourite.dishes.some(d => d._id.toString() === dish._id);
      if (!exists) {
        favourite.dishes.push(dish);
        await favourite.save();
      }
    } else {
      favourite = new Favourite({ userId, dishes: [dish] });
      await favourite.save();
    }
    res.json(favourite);
  } catch (err){
    res.status(500).json({ error: err.message });
  }
})

app.delete("/api/favourites/:userId/:dishId", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    const dishId = new mongoose.Types.ObjectId(req.params.dishId);
    const favourite = await Favourite.findOne({ userId });
    if (!favourite) return res.status(404).json({ error: "Favourites not found" });
    favourite.dishes = favourite.dishes.filter(d => d._id.toString() !== dishId.toString());
    await favourite.save();
    res.json({ message: "Remove from favourites", dishes: favourite.dishes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.use("/uploads", express.static("uploads"))


app.post("/api/posts", async (req, res) => {
  try {
    const newPost = new Post(req.body);
    await newPost.save();
    res.status(201).json(newPost)
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get("/api/posts", async (req, res) => {
  try {
    const { authorId, author, status, limit, savedBy } = req.query;
    let query = {};
    if (authorId) {
      if (mongoose.Types.ObjectId.isValid(authorId)) {
        query.$or = [{ authorId: new mongoose.Types.ObjectId(authorId) }, { authorId: authorId }];
      } else {
        query.authorId = authorId;
      }
    }
    if (author) query.author = author;
    if (status) query.status = status; 
    if (savedBy) {
      if (mongoose.Types.ObjectId.isValid(savedBy)) {
        query.$or = [...(query.$or || []), { savedBy: new mongoose.Types.ObjectId(savedBy) }, { savedBy: savedBy }];
      } else {
        query.savedBy = savedBy;
      }
    }
    let postsQuery = Post.find(query).populate('authorId', 'name avatar').sort({ createdAt: -1 });
    if (limit) postsQuery = postsQuery.limit(parseInt(limit)); 
    const posts = await postsQuery;
    const postsWithAvatar = posts.map(post => {
      const postObj = post.toObject();
      if (post.authorId && typeof post.authorId === 'object') {
        postObj.authorId = String(post.authorId._id);
        postObj.avatar = post.authorId.avatar || "";
        postObj.authorName = post.authorId.name || post.author;
      } else {
        postObj.authorId = post.authorId || "";
        postObj.avatar = "";
        postObj.authorName = post.author;
      }
      return postObj;
    });
    res.json(postsWithAvatar);
  } catch (err) {
    console.error("Failed to fetch posts:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/posts/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid post ID" });
    const post = await Post.findById(postId).populate('authorId', 'name avatar');
    if (!post) return res.status(404).json({ error: "Post not found" });
    const postObj = post.toObject();
    if (post.authorId && post.authorId.avatar) postObj.avatar = post.authorId.avatar;
    else postObj.avatar = "";
    res.json(postObj);
  } catch (err) {
    console.error("Failed to fetch post:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/posts/:id/approve", async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, { status: "approved"}, { returnDocument: 'after' })
    if (!post) return res.status(404).json({ error: "Post not found" })
    if (post.authorId) {
      await Notification.create({
        userId: post.authorId,
        type: "admin_approval",
        title: "Post Approved!",
        message: `Your post "${post.title}" has been approved and is now live!`,
        relatedPostId: post._id
      })
    }
    res.json(post) 
  } catch (err){
    res.status(500).json({ error: err.message })
  }
})

app.put("/api/posts/:id/reject", async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, { status: "rejected", rejectReason: req.body.reason }, { returnDocument: 'after' })
    if (!post) return res.status(404).json({ error: "Post not found" })
    res.json(post)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put("/api/posts/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: "Post not found" })
    const likerId = req.body.likerId
    if (!likerId) return res.status(400).json({ error: "likerId required" })
    const userHasLiked = post.likedBy?.some(id => String(id) === String(likerId)) || false
    if (req.body.liked && !userHasLiked) {
      if (!post.likedBy) post.likedBy = []
      post.likedBy.push(likerId)
      post.likes = (post.likes || 0) + 1
    } else if (!req.body.liked && userHasLiked) {
      post.likedBy = post.likedBy?.filter(id => String(id) !== String(likerId)) || []
      post.likes = Math.max(0, (post.likes || 0) - 1)
    }
    await post.save()
    const postObj = post.toObject()
    postObj.liked = post.likedBy?.some(id => String(id) === String(likerId)) || false
    if (req.body.liked && post.authorId && likerId !== post.authorId.toString()) {
      await Notification.create({
        userId: post.authorId,
        senderId: likerId,
        type: 'like',
        title: 'Someone liked your post',
        message: `${req.body.likerName || 'A user'} liked your post "${post.title}"`,
        relatedPostId: post._id
      });
    }
    res.json(postObj)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/posts/:id/comment", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: "Post not found" })
    post.commentsList.push({ author:req.body.author, text: req.body.text })
    post.comments = post.commentsList.length
    await post.save()
    res.json(post)
  } catch (err){
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/posts/:id/save", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const userIdStr = String(userId);
    const alreadySaved = post.savedBy.some(id => String(id) === userIdStr);
    if (!alreadySaved) {
      post.savedBy.push(userId);
      await post.save();
    }
    res.json({ message: 'Post saved successfully', saved: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.delete('/api/posts/:id/save', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.savedBy = post.savedBy.filter(id => String(id) !== String(userId));
    await post.save();
    res.json({ message: 'Post unsaved successfully', saved: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

const upload = multer({ dest: "uploads/"})
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname;
    cb(null, uniqueName);
  }
})
const uploadMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|mp4|webm/;
    const ext = allowed.test(file.originalname.toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only images/videos allowed'));
  }
})

app.post("/api/upload", uploadMedia.array("file", 10), (req, res) => {
  console.log('DEBUG: /api/upload received ===')
  console.log('Files count:', req.files?.length || 0)
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" })
    }

    const uploadedFiles = req.files.map(file => ({
      url: `${API_BASE_URL}/uploads/${file.filename}`,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size
    }))
    
    res.json({ 
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    })
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ error: err.message })
  }
})


app.post("/api/init-admin", async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ email: "admin@staff.com" });
    if (existingAdmin) return res.status(400).json({ error: "Admin already exists" });
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminUser = new User({ name: "Admin", email: "admin@staff.com", password: hashedPassword, role: "admin" });
    await adminUser.save();
    res.status(201).json({ message: "Admin user created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.get("/api/users/search", async (req, res) => {
  try {
    const { q } = req.query;
    const regex = new RegExp(q, "i");
    const users = await User.find({ $or: [{ name: regex }, { email: regex}] });
    res.json(users); 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

function generateRandomPassword(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

app.post("/api/users", async (req, res) => {
  try {
    const { name, email, password, location, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });
    const rawPassword = password || generateRandomPassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const newUser = new User ({ name, email, password: hashedPassword, location, role: role || "user", firstLogin: true })
    await newUser.save();
    res.status(201).json({...newUser.toObject(), tempPassword: rawPassword })
  } catch (err){
    res.status(500).json({ error: err.message });
  }
})

app.put("/api/users/:id", async (req, res) => {
  try {
    const { name, email, location, role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { name ,email, location, role }, { returnDocument: 'after' });
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.delete("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "admin") return res.status(403).json({ error: "Cannot delete admin user" })
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/login", async (req, res) => {
  try {
    const { email, password} = req.body
    const user = await User.findOne({ email })
    if(!user) return res.status(404).json({ error: "User not found" })
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" })
    res.json({ 
      message: "Login successfull", 
      userId: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      firstLogin: user.firstLogin
    })
  } catch (err){
    res.status(500).json({ error: err.message})
  }
})

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email} = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If the email exists, a reset link has been sent' });
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 60 * 60 * 1000;
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    console.log('Password reset link:', resetLink);
    res.json({ message: 'If the email exists, a reset link has been sent'});
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
})

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    if (!token || !email || !newPassword) return res.status(400).json({ error: 'Missing required fields' })
    const user = await User.findOne({ email, resetPasswordToken: token, resetPasswordExpiry : {$gt: Date.now() } })
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    user.firstLogin = false;
    await user.save();
    res.json({ message: 'Password reset successfully. Please log in.'})
  } catch (err) {
    console.error('Reset password error:', err );
    res.status(500).json({ error: 'Failed to reset password' });
  } 
})

app.put("/api/user/change-password/:id", async (req, res) => {
  try {
    const { newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { password: hashedPassword, firstLogin: false}, { returnDocument: 'after' });
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password, location } = req.body
    const existingUser = await User.findOne({ email })
    if (existingUser) return res.status(400).json({ error: "Email already registered" })
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = new User({ name: username, email, password: hashedPassword, location })
    await newUser.save()
    res.status(201).json({message: "User registered successfully", userId: newUser._id })
  } catch (err){
    res.status(500).json({ error: err.message })
  }
})

app.get("/api/user/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put("/api/user/profile/:id", upload.single("avatar"), async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const requestUserId = req.headers['x-user-id'];
    if (requestUserId && requestUserId !== targetUserId) {
      return res.status(403).json({ error: "Forbidden: You can only edit your own profile" });
    }
    
    const updateData = { name: req.body.name, email: req.body.email, location: req.body.location }

    if (req.file) {
      updateData.avatar = `${API_BASE_URL}/uploads/${req.file.filename}`
    }

    const updatedUser = await User.findByIdAndUpdate(targetUserId, updateData, { returnDocument: 'after'}).select('-password');
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

const heroLandmarks = {
  Malaysia: "Petronas Twin Towers",
  Japan: "Mount Fuji",
  USA: "Statue of Liberty",
  France: "Eiffel Tower",
  UK: "Big Ben",
  China: "Great Wall of China",
  India: "Taj Mahal"
};

app.get("/api/user/:id/following/status", async (req, res) => {
  try{
    const { id } = req.params;
    const { followerId } = req.query;
    if (!followerId) return res.status(400).json({ error: "followerId required" });
    const follow = await Follow.findOne({
      followerId: new mongoose.Types.ObjectId(followerId),
      followingId: new mongoose.Types.ObjectId(id) 
    });
    res.json({ isFollowing: !!follow, followedAt: follow?.createdAt || null })
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

app.post("/api/user/:id/follow", async (req, res) => {
  try {
    const { id } = req.params;
    const { followerId, action } = req.body;
    if (!followerId) return res.status(400).json({ error: "followerId required" });
    if (followerId === id) return res.status(400).json({ error: "Cannot follow yourself" });
    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ error: "User not found" });
    const fId = new mongoose.Types.ObjectId(followerId);
    const tId = new mongoose.Types.ObjectId(id);
    if (action === 'follow') {
      const follow = await Follow.findOneAndUpdate({ followerId: fId, followingId: tId }, { $set: { createdAt: new Date() } }, { upsert: true, returnDocument: 'after' });
      res.status(201).json({ message: "Followed", isFollowing: true, followedAt: follow.createdAt });
    } else if (action === 'unfollow') {
      const result = await Follow.findOneAndDelete({ followerId: fId, followingId: tId });
      if (!result) return res.status(404).json({ error: "Not following" });
      res.json({ message: "Unfollowed", isFollowing: false });
    } else {
      return res.status(400).json({ error: "action must be 'follow' or 'unfollow'" });
    }
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Already following" });
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/hero-image", async (req, res) => {
  const country = req.query.country || "landmark";
  const query = heroLandmarks[country] || `${country} landmark`;

  const UNSPLASH_KEY = process.env.UNSPLASH_API_KEY;
  if (!UNSPLASH_KEY) {
    return res.status(500).json({ error: "UNSPLASH_API_KEY not configured" });
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=3&client_id=${UNSPLASH_KEY}`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      let bestPhoto = null;
      let bestScore = Infinity;
      let bestPosition = "center center";
      for (const photo of data.results) {
        const photoUrl = photo.urls.full;
        const buffer = await fetch(photoUrl).then((r) => r.arrayBuffer());
        const stats = await sharp(Buffer.from(buffer)).stats();
        const avgBrightness = stats.channels[0].mean + stats.channels[1].mean + stats.channels[2].mean;
        let position = "center center";
        if (avgBrightness < 100) position = "center bottom";
        else if (avgBrightness > 180) position = "center top";
        const score = Math.abs(avgBrightness - 140);
        if (score < bestScore) {
          bestScore = score;
          bestPhoto = photo.urls.regular; 
          bestPosition = position;
        }
      }
      res.json({ image: bestPhoto, position: bestPosition });
    } else {
      res.json({ image: null, position: "center center", message: "No image found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

app.get("/api/dish-image", async (req, res) => {
  const dish = req.query.dish || "food";

  const UNSPLASH_KEY = process.env.UNSPLASH_API_KEY;
  if (!UNSPLASH_KEY) {
    return res.status(500).json({ error: "UNSPLASH_API_KEY not configured" });
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(dish)}&orientation=landscape&per_page=3&client_id=${UNSPLASH_KEY}`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const bestPhoto = data.results[0].urls.regular;
      res.json({ image: bestPhoto, position: "center center" });
    } else {
      res.json({ image: "/images/default-dish.jpg", position: "center center" });
    }
  } catch (error) {
    console.error("Error fetching dish image:", error);
    res.status(500).json({ image: "/images/default-dish.jpg", position: "center center" });
  }
});


app.get("/api/trips/:userId", async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.params.userId });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/trips/:userId", async (req, res) => {
  try {
    const { title, description, countries, startDate, endDate } = req.body;
    const trip = new Trip({ 
      userId: req.params.userId, 
      title, 
      description, 
      countries, 
      startDate, 
      endDate, 
      days: [] 
    });
    await trip.save();
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get("/api/trips/:userId/:tripId", async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.tripId, userId: req.params.userId });
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    for (let day of trip.days) {
      for(let i = 0; i < day.dishes.length; i++){
        const dishRef = day.dishes[i];
        if (dishRef._id){
          const latestDish = await Recipe.findById(dishRef._id);
          if (latestDish){
            day.dishes[i] = { ...dishRef, name: latestDish.name || dishRef.name, city: latestDish.city || dishRef.city, description: latestDish.description || dishRef.description, image: latestDish.image || dishRef.image }
          }
        }
      }
    }
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put("/api/trips/:userId/:tripId", async (req, res) => {
  try {
    const { days } = req.body;
    const trip = await Trip.findOneAndUpdate({ _id: req.params.tripId, userId: req.params.userId }, { days }, { returnDocument: 'after' });
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    res.json(trip);
  } catch (err) {
    res.status(500).json({error: err.message})
  }
})

app.delete("/api/trips/:userId/:tripId", async (req, res) => {
  try {
    const result = await Trip.findOneAndDelete({ _id: req.params.tripId, userId: req.params.userId })
    if (!result) return res.status(404).json({ error: "Trip not found" });
    res.json({ message: "Trip deleted "})
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/geocode', async (req, res) => {
  try {
    const { location } = req.query;
    if (!location) return res.status(400).json({ error: 'Location required' });

    const LOCATIONIQ_KEY = process.env.LOCATIONIQ_KEY;
    if (!LOCATIONIQ_KEY) {
      return res.status(500).json({ error: 'LOCATIONIQ_KEY not configured' });
    }

    const response = await fetch(
      `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(location)}&format=json&limit=1`
    )
    const data = await response.json();
    if (data.length > 0){
      return res.json({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
    }
    return res.status(400).json({ error: 'Location not found' });
  } catch (error){
    console.error('LocationIQ error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch coordinates' });
  }
});


app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:notifId/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.notifId, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:userId/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.params.userId, isRead: false }, { isRead: true });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const { userId, senderId, type, title, message, relatedPostId, relatedTripId} = req.body;
    if (!userId || !type || !title || !message) return res.status(400).json({ error: 'Missing required fields' });
    const notification = new Notification({ 
      userId, 
      senderId, 
      type, 
      title, 
      message, 
      relatedPostId, 
      relatedTripId 
    });
    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.use((req, res, next) => {
    if (
      req.method === 'GET' && 
      !req.path.startsWith('/api') && 
      !req.path.startsWith('/uploads') &&
      !req.path.includes('.')
    ) {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
      next();
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server running on ${API_BASE_URL}`);
});