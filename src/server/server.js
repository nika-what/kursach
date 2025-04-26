import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

// Connect to SQLite database
const db = new sqlite3.Database('shop.db', async (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');

    // Create news table
    db.run(`CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      image TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Add sample news
    db.run(`INSERT OR IGNORE INTO news (title, content) VALUES 
      ('Открытие нового интернет-магазина Пет-Плейс!', 'Мы рады сообщить об открытии нашего нового интернет-магазина для домашних животных! У нас вы найдете широкий ассортимент товаров для собак, кошек, птиц, рыб и грызунов. Удобная доставка и профессиональная консультация наших специалистов сделают ваши покупки приятными и легкими.'),
      ('Специальные скидки на корма премиум-класса', 'В честь открытия магазина мы запускаем акцию на все корма премиум-класса. Скидки до 20% на selected товары. Спешите воспользоваться выгодным предложением!'),
      ('Новая система лояльности', 'Мы запустили новую систему лояльности для наших покупателей. Регистрируйтесь на сайте и получайте дополнительные бонусы за каждую покупку. Накопленные баллы можно использовать для получения скидок на следующие заказы.'),
      ('Расширение ассортимента товаров', 'Мы постоянно расширяем наш ассортимент. Теперь в нашем каталоге появились новые товары для всех видов домашних животных. Особое внимание мы уделили товарам для грызунов и птиц.')`);

    // Create chat messages table
    db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      message TEXT,
      is_admin_reply INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      is_admin INTEGER DEFAULT 0
    )`);

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    db.run(`
      INSERT OR IGNORE INTO users (username, email, password, is_admin)
      VALUES (?, ?, ?, ?)
    `, ['admin', 'admin@example.com', hashedPassword, 1]);
  }
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if user exists
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      if (user) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }

      // Insert user into database
      db.run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        function(err) {
          if (err) {
            console.error('Registration error:', err);
            return res.status(500).json({ error: 'Could not create user' });
          }

          // Generate token
          const token = jwt.sign({ userId: this.lastID }, 'your_jwt_secret');
          res.status(201).json({
            token,
            username,
            email,
            id: this.lastID
          });
        }
      );
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user.id }, 'your_jwt_secret');
    res.json({
      token,
      username: user.username,
      email: user.email,
      id: user.id,
      isAdmin: user.is_admin === 1
    });
  });
});

const PORT = process.env.PORT || 5000;
// Products endpoint
app.get('/api/products', (req, res) => {
  const { search, minPrice, maxPrice, rating, category } = req.query;

  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (req.query.isOnSale) {
    query += ' AND isOnSale = 1 AND salePrice IS NOT NULL';
  }

  if (search) {
    query += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }

  if (minPrice) {
    query += ' AND price >= ?';
    params.push(minPrice);
  }

  if (maxPrice) {
    query += ' AND price <= ?';
    params.push(maxPrice);
  }

  if (rating) {
    query += ' AND rating >= ?';
    params.push(rating);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  db.all(query, params, (err, products) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(products || []);
  });
});

// Create products table
db.run(`CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  description TEXT,
  price REAL,
  category TEXT,
  image TEXT,
  images TEXT,
  rating REAL DEFAULT 5,
  reviews INTEGER DEFAULT 0,
  isNew BOOLEAN DEFAULT 0,
  isOnSale BOOLEAN DEFAULT 0,
  salePrice REAL,
  stock INTEGER DEFAULT 0,
  dimensions TEXT
)`);

//Adding product endpoint
app.post('/api/products', (req, res) => {
  try {
    const { 
      name, description, price, category, images, 
      isNew, isOnSale, salePrice, stock,  
      dimensions 
    } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Take first image as main image
    const mainImage = Array.isArray(images) && images.length > 0 ? images[0] : '';

    db.run(
      `INSERT INTO products (
        name, description, price, category, image, images,
        isNew, isOnSale, salePrice, stock, 
        dimensions, rating, reviews
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, description, Number(price), category, mainImage, JSON.stringify(images),
        isNew ? 1 : 0, isOnSale ? 1 : 0, salePrice, stock,
        dimensions, 5, 0
      ],
      function(err) {
        if (err) {
          console.error('Error creating product:', err);
          return res.status(500).json({ error: 'Could not create product' });
        }

        const newProduct = {
          id: this.lastID,
          name,
          description,
          price: Number(price),
          category,
          images, // Corrected to images
          rating: 5,
          reviews: 0
        };

        res.status(201).json(newProduct);
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Verify token endpoint
app.get('/api/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    db.get('SELECT * FROM users WHERE id = ?', [decoded.userId], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isAdmin: user.is_admin === 1
        }
      });
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Edit product endpoint
app.put('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  const { 
    name, description, price, category, images,
    isNew, isOnSale, salePrice, stock, dimensions 
  } = req.body;

  if (!name || !description || !price || !category || !images) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  db.run(
    `UPDATE products SET 
    name = ?, description = ?, price = ?, category = ?, 
    images = ?, isNew = ?, isOnSale = ?, salePrice = ?, 
    stock = ?, dimensions = ?
    WHERE id = ?`,
    [
      name, description, Number(price), category,
      JSON.stringify(images), isNew ? 1 : 0, isOnSale ? 1 : 0,
      salePrice, stock, dimensions, productId
    ],
    function(err) {
      if (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ error: 'Could not update product' });
      }
      res.json({ message: 'Product updated successfully' });
    }
  );
});

// Delete product endpoint
app.delete('/api/products/:id', (req, res) => {
  const productId = req.params.id;

  db.run('DELETE FROM products WHERE id = ?', [productId], function(err) {
    if (err) {
      console.error('Error deleting product:', err);
      return res.status(500).json({ error: 'Could not delete product' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  });
});

// Chat endpoints
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  const userId = req.headers['user-id'];

  if (!message || !userId) {
    return res.status(400).json({ error: 'Message and user ID are required' });
  }

  db.run('INSERT INTO chat_messages (user_id, message) VALUES (?, ?)',
    [userId, message],
    function(err) {
      if (err) {
        console.error('Error saving message:', err);
        return res.status(500).json({ error: 'Could not save message' });
      }
      res.status(201).json({ id: this.lastID, message, userId });
    });
});

app.post('/api/chat/reply', (req, res) => {
  const { message, userId } = req.body;
  const adminId = req.headers['user-id'];

  db.get('SELECT is_admin FROM users WHERE id = ?', [adminId], (err, user) => {
    if (err || !user || !user.is_admin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    db.run('INSERT INTO chat_messages (user_id, message, is_admin_reply) VALUES (?, ?, 1)',
      [userId, message],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Could not save reply' });
        }
        res.status(201).json({ id: this.lastID, message, userId });
      });
  });
});

// News endpoints
app.post('/api/news', (req, res) => {
  const { title, content, image } = req.body;
  const adminId = req.headers['user-id'];

  db.get('SELECT is_admin FROM users WHERE id = ?', [adminId], (err, user) => {
    if (err || !user || !user.is_admin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    db.run('INSERT INTO news (title, content, image) VALUES (?, ?, ?)',
      [title, content, image],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Could not create news' });
        }
        res.status(201).json({ id: this.lastID, title, content });
      });
  });
});

app.get('/api/news', (req, res) => {
  db.all('SELECT * FROM news ORDER BY date DESC', [], (err, news) => {
    if (err) {
      return res.status(500).json({ error: 'Could not fetch news' });
    }
    res.json(news);
  });
});

app.delete('/api/news/:id', (req, res) => {
  const newsId = req.params.id;
  const adminId = req.headers['user-id'];

  db.get('SELECT is_admin FROM users WHERE id = ?', [adminId], (err, user) => {
    if (err || !user || !user.is_admin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    db.run('DELETE FROM news WHERE id = ?', [newsId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Could not delete news' });
      }
      res.json({ message: 'News deleted successfully' });
    });
  });
});

app.get('/api/chat', (req, res) => {
  const userId = req.headers['user-id'];
  
  db.all('SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, messages) => {
      if (err) {
        return res.status(500).json({ error: 'Could not fetch messages' });
      }
      res.json(messages);
    });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});