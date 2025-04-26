import { useState, useEffect } from 'react'
import './App.css'

export default function App() {
  const [products, setProducts] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);

  const [newProducts, setNewProducts] = useState([]);

  useEffect(() => {
    // Fetch sale products
    fetch('/api/products?isOnSale=1')
      .then(res => res.json())
      .then(data => setSaleProducts(data))
      .catch(err => console.error('Error fetching sale products:', err));

    // Fetch new products where isNew is true
    fetch('/api/products?isNew=1')
      .then(res => res.json())
      .then(data => {
        // Filter to only include products where isNew is true
        const newProds = data.filter(product => product.isNew === 1);
        setNewProducts(newProds);
      })
      .catch(err => console.error('Error fetching new products:', err));
  }, []);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [news, setNews] = useState([]); // Added state for news

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(err => {
        console.error('Error verifying token:', err);
        localStorage.removeItem('token');
      });
    }
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [minRating, setMinRating] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', password: '', email: '' });
  const [selectedTab, setSelectedTab] = useState('');
  const [messages, setMessages] = useState([]); // Added state for chat messages
  const [newMessage, setNewMessage] = useState(''); // Added state for new message input

  const categories = ['Собаки', 'Кошки', 'Птицы', 'Рыбы', 'Грызуны'];

  useEffect(() => {
    fetchProducts();
    // Fetch news on component mount
    fetch('/api/news')
      .then(res => res.json())
      .then(setNews)
      .catch(console.error);
  }, [searchQuery, priceRange, minRating, selectedCategory]);

  useEffect(() => {
    // Fetch chat messages if user is logged in and support tab is active.  This assumes a suitable API endpoint exists.
    const fetchMessages = async () => {
      if (user && activeTab === 'support') {
        try {
          const response = await fetch(`/api/chat?user_id=${user.id}`);
          const data = await response.json();
          setMessages(data);
        } catch (error) {
          console.error("Error fetching chat messages:", error);
        }
      }
    };
    fetchMessages();
  }, [user, activeTab]);


  const fetchProducts = async () => {
    try {
      let url = `/api/products?search=${searchQuery}`;
      if (priceRange.min) url += `&minPrice=${priceRange.min}`;
      if (priceRange.max) url += `&maxPrice=${priceRange.max}`;
      if (minRating) url += `&rating=${minRating}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;

      const response = await fetch(url);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data);
        localStorage.setItem('token', data.token);
        setActiveTab('profile');
        alert('Registration successful!');
      } else {
        alert(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Register error:', error);
      alert('An error occurred during registration. Please try again.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data);
        localStorage.setItem('token', data.token);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const addToCart = (product) => {
    if (!user) {
      const loginPrompt = document.createElement('div');
      loginPrompt.className = 'login-prompt';
      loginPrompt.innerHTML = `
        <div class="login-prompt-content">
          <h3>Вы не можете добавить товар в корзину</h3>
          <p>Пожалуйста, зарегистрируйтесь или войдите в профиль</p>
          <button onclick="this.parentElement.parentElement.remove()">Закрыть</button>
        </div>
      `;
      document.body.appendChild(loginPrompt);
      return;
    }
    setCart([...cart, product]);
  };

  return (
    <main className="container">
      <nav className="navbar">
        <h1 onClick={() => setActiveTab('home')} style={{cursor: 'pointer'}}>Пет-Плейс</h1>
        <div className={`burger-menu ${isMenuOpen ? 'active' : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <button onClick={() => { setActiveTab('payment'); setIsMenuOpen(false); }}>Доставка и Оплата</button>
          <button onClick={() => { setActiveTab('news'); setIsMenuOpen(false); }}>Новости</button>
          <button onClick={() => { setActiveTab('support'); setIsMenuOpen(false); }}>Вопрос-ответ</button> {/* Changed to support */}
          {user ? (
            <button onClick={() => setActiveTab('login')}>Профиль</button>
          ) : (
            <>
              <button onClick={() => setActiveTab('login')}>Вход</button>
              <button onClick={() => setActiveTab('register')}>Регистрация</button>
            </>
          )}
          <div className="cart-icon" onClick={() => setActiveTab('cart')}>
            <svg viewBox="0 0 500 500" width="24" height="24">
              <path d="M0 50 L100 50 L150 400 L400 400 L450 150 L100 150" stroke="black" strokeWidth="40" fill="none"/>
              <circle cx="200" cy="450" r="30" fill="black"/>
              <circle cx="350" cy="450" r="30" fill="black"/>
            </svg>
            <span className="cart-count">{cart.length}</span>
          </div>
        </div>
      </nav>

      <div className="content">
        {activeTab === 'home' && (
          <>
            <div className="sales-section">
              <h2>Распродажа</h2>
              <div className="sales-grid-container">
                <button className="carousel-arrow prev" onClick={() => {
                  const container = document.querySelector('.sales-grid');
                  container.scrollBy({ left: -300, behavior: 'smooth' });
                }}>❮</button>
                <div className="sales-grid">
                  {saleProducts.map(product => (
                  <div key={product.id} className="sale-product-card" onClick={() => setActiveTab('product-' + product.id)}>
                    <div className="product-image">
                      <img src={product.images ? JSON.parse(product.images)[0] : product.image} alt={product.name} />
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <div className="rating">
                        {'★'.repeat(5)}
                        <span>(0)</span>
                      </div>
                      <div className="price">
                        <span className="original-price">{product.price} ₽</span>
                        <span className="sale-price">{product.salePrice} ₽</span>
                      </div>
                      <button className="cart-button" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>В корзину</button>
                    </div>
                  </div>
                ))}
                </div>
                <button className="carousel-arrow next" onClick={() => {
                  const container = document.querySelector('.sales-grid');
                  container.scrollBy({ left: 300, behavior: 'smooth' });
                }}>❯</button>
              </div>
            </div>
            <div className="sales-section">
              <h2>Новинки</h2>
              <div className="sales-grid-container">
                <button className="carousel-arrow prev" onClick={(e) => {
                  const container = e.target.nextElementSibling;
                  container.scrollBy({ left: -300, behavior: 'smooth' });
                }}>❮</button>
                <div className="sales-grid">
                  {newProducts.map(product => (
                  <div key={product.id} className="sale-product-card" onClick={() => setActiveTab('product-' + product.id)}>
                    <div className="product-image">
                      <img src={product.images ? JSON.parse(product.images)[0] : product.image} alt={product.name} />
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <div className="rating">
                        {'★'.repeat(5)}
                        <span>(0)</span>
                      </div>
                      <div className="price">
                        <span className="price">{product.price} ₽</span>
                      </div>
                      <button className="cart-button" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>В корзину</button>
                    </div>
                  </div>
                ))}
                </div>
                <button className="carousel-arrow next" onClick={(e) => {
                  const container = e.target.previousElementSibling;
                  container.scrollBy({ left: 300, behavior: 'smooth' });
                }}>❯</button>
              </div>
            </div>
            <div className="categories">
            <div className="category-item" onClick={() => setActiveTab('dogs')}>
              <img src="attached_assets/собаки.jpg" alt="Собаки" />
              <span>Собаки</span>
            </div>
            <div className="category-item" onClick={() => setActiveTab('cats')}>
              <img src="attached_assets/кошки.jpg" alt="Кошки" />
              <span>Кошки</span>
            </div>
            <div className="category-item" onClick={() => setActiveTab('birds')}>
              <img src="attached_assets/попугей.jpg" alt="Птицы" />
              <span>Птицы</span>
            </div>
            <div className="category-item" onClick={() => setActiveTab('fish')}>
              <img src="attached_assets/рыбки.jpg" alt="Рыбы" />
              <span>Рыбы</span>
            </div>
            <div className="category-item" onClick={() => setActiveTab('small_pets')}>
              <img src="attached_assets/грызуны.jpg" alt="Грызуны" />
              <span>Грызуны</span>
            </div>
          </div>
          </>
        )}

        {activeTab === 'cart' && (
          <div className="cart">
            <h2>Корзина</h2>
            {cart.map((item, index) => (
              <div key={index} className="cart-item">
                <img src={item.image} alt={item.name} />
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p>{item.price} ₽</p>
                </div>
                <button onClick={() => {
                  const newCart = [...cart];
                  newCart.splice(index, 1);
                  setCart(newCart);
                }}>Удалить</button>
              </div>
            ))}
            <div className="cart-total">
              <h3>Итого: {cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)} ₽</h3>
              <button onClick={() => setActiveTab('payment')}>Оплатить</button>
            </div>
          </div>
        )}

        {activeTab === 'login' && !user ? (
          <div className="auth-form">
            <h2>Вход</h2>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Имя пользователя"
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
              />
              <input
                type="password"
                placeholder="Пароль"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              />
              <button type="submit">Войти</button>
            </form>
          </div>
        ) : activeTab === 'register' && !user ? (
          <div className="auth-form">
            <h2>Регистрация</h2>
            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Имя пользователя"
                value={registerData.username}
                onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
              />
              <input
                type="email"
                placeholder="Электронная почта"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
              />
              <input
                type="password"
                placeholder="Пароль"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
              />
              <button type="submit">Зарегистрироваться</button>
            </form>
          </div>
        ) : (activeTab === 'login' || activeTab === 'register') && user ? (
          <div className="profile-page">
            <div className="profile-container">
              <h2>Мой профиль</h2>
              <div className="profile-section">
                <h3>Личная информация</h3>
                <div className="profile-info">
                  <div className="info-group">
                    <label>Имя пользователя:</label>
                    <input 
                      type="text" 
                      value={user.username} 
                      disabled 
                    />
                  </div>
                  <div className="info-group">
                    <label>Email:</label>
                    <input 
                      type="email" 
                      value={user.email} 
                      disabled 
                    />
                  </div>
                  <div className="info-group">
                    <label>Адрес доставки:</label>
                    <input 
                      type="text" 
                      placeholder="Введите адрес доставки"
                      value={user.address || ''}
                      onChange={(e) => setUser({...user, address: e.target.value})}
                    />
                  </div>
                  <div className="info-group">
                    <label>Номер телефона:</label>
                    <input 
                      type="tel" 
                      placeholder="Введите номер телефона"
                      value={user.phone || ''}
                      onChange={(e) => setUser({...user, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="profile-actions">
                  <button className="save-button">Сохранить изменения</button>
                  <button className="logout-button" onClick={() => {
                    setUser(null);
                    localStorage.removeItem('token');
                    setActiveTab('home');
                  }}>Выйти</button>
                </div>
              </div>
              {user.isAdmin && (
                <div className="admin-panel">
                  <h3>Панель администратора</h3>
                  <div className="admin-chat">
                    <h4>Сообщения пользователей</h4>
                    <div className="chat-messages-admin">
                      {messages.map((msg) => (
                        <div key={msg.id} className="admin-chat-message">
                          <div className="message-header">
                            <span>От: Пользователь #{msg.user_id}</span>
                            <span>{new Date(msg.created_at).toLocaleString()}</span>
                          </div>
                          <p>{msg.message}</p>
                          <div className="reply-section">
                            <input
                              type="text"
                              placeholder="Написать ответ..."
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  fetch('/api/chat/reply', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'user-id': user.id
                                    },
                                    body: JSON.stringify({
                                      message: e.target.value,
                                      userId: msg.user_id
                                    })
                                  })
                                  .then(res => res.json())
                                  .then(() => {
                                    e.target.value = '';
                                    // Refresh messages
                                    fetch('/api/chat', {
                                      headers: { 'user-id': msg.user_id }
                                    })
                                    .then(res => res.json())
                                    .then(setMessages);
                                  });
                                }
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="admin-products">
                    <h4>Управление товарами</h4>
                    <div className="products-list">
                      {products.map((product) => (
                        <div key={product.id} className="admin-product-item">
                          <img src={product.image} alt={product.name} />
                          <div className="product-details">
                            <h5>{product.name}</h5>
                            <p>{product.price} ₽</p>
                            <p>Категория: {product.category}</p>
                          </div>
                          <div className="admin-product-buttons">
                            <button
                              className="edit-button"
                              onClick={() => {
                                const form = document.querySelector('.admin-panel form');
                                form.name.value = product.name;
                                form.description.value = product.description;
                                form.price.value = product.price;
                                form.category.value = product.category;
                                form.stock.value = product.stock || 0;
                                form.isNew.checked = product.isNew === 1;
                                form.isOnSale.checked = product.isOnSale === 1;
                                form.salePrice.value = product.salePrice || '';
                                form.dimensions.value = product.dimensions || '';
                                form.dataset.editId = product.id;
                                window.scrollTo(0, form.offsetTop);
                              }}
                            >
                              Редактировать
                            </button>
                            <button 
                              className="delete-button"
                              onClick={async () => {
                                if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
                                  try {
                                    const response = await fetch(`/api/products/${product.id}`, {
                                      method: 'DELETE'
                                    });

                                    if (response.ok) {
                                      fetchProducts();
                                      alert('Товар успешно удален');
                                    } else {
                                      alert('Ошибка при удалении товара');
                                    }
                                  } catch (error) {
                                    console.error('Ошибка при удалении:', error);
                                    alert('Ошибка при удалении товара');
                                  }
                                }
                              }}
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <h4>Добавить новый товар</h4>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const files = e.target.images.files;
                    const imagePromises = [];
                    const editId = e.target.dataset.editId;

                    for (let file of files) {
                      imagePromises.push(new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(file);
                      }));
                    }

                    const images = await Promise.all(imagePromises);

                    try {
                      const response = await fetch(editId ? `/api/products/${editId}` : '/api/products', {
                        method: editId ? 'PUT' : 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          name: formData.get('name'),
                          description: formData.get('description'),
                          price: Number(formData.get('price')),
                          category: formData.get('category'),
                          images: images,
                          isNew: formData.get('isNew') === 'on',
                          isOnSale: formData.get('isOnSale') === 'on',
                          salePrice: Number(formData.get('salePrice')) || null,
                          stock: Number(formData.get('stock')) || 0,
                          brand: formData.get('brand'),
                          weight: formData.get('weight'),
                          dimensions: formData.get('dimensions')
                        })
                      });

                      if (response.ok) {
                        await fetchProducts();
                        e.target.reset();
                        alert('Товар успешно добавлен!');
                      } else {
                        alert('Не удалось создать товар');
                      }
                    } catch (error) {
                      console.error('Ошибка при создании товара:', error);
                      alert('Ошибка при создании товара');
                    }
                  }}>
                    <div className="form-group">
                      <input name="name" placeholder="Название товара" required />
                      <textarea name="description" placeholder="Описание" required />
                      <input name="price" type="number" step="0.01" placeholder="Цена" required />
                      <select name="category" required>
                        <option value="">Выберите категорию</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <input 
                        type="file" 
                        name="images" 
                        accept="image/*"
                        multiple
                        required
                        onChange={(e) => {
                          if (e.target.files.length > 5) {
                            alert('Можно загрузить максимум 5 фотографий');
                            e.target.value = '';
                          }
                        }}
                      />
                      <small>Максимум 5 фотографий</small>
                      <input name="dimensions" placeholder="Размеры" />
                      <input name="sizes" placeholder="Размеры (через запятую, например: S,M,L,XL)" />
                      <input name="stock" type="number" placeholder="Количество на складе" />
                      <div className="checkbox-group">
                        <label>
                          <input type="checkbox" name="isNew" /> Новинка
                        </label>
                        <label>
                          <input type="checkbox" name="isOnSale" /> Распродажа
                        </label>
                      </div>
                      <input 
                        name="salePrice" 
                        type="number" 
                        step="0.01" 
                        placeholder="Цена со скидкой" 
                      />
                    </div>
                    <button type="submit">Добавить товар</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {(activeTab === 'dogs' || activeTab === 'cats' || activeTab === 'birds' || activeTab === 'fish' || activeTab === 'small_pets') && (
          <div className="category-products-page">
            <div className="category-header">
              <button className="back-arrow" onClick={() => setActiveTab('home')}>←</button>
              <h2>
              {activeTab === 'dogs' && 'Товары для собак'}
              {activeTab === 'cats' && 'Товары для кошек'}
              {activeTab === 'birds' && 'Товары для птиц'}
              {activeTab === 'fish' && 'Товары для рыб'}
              {activeTab === 'small_pets' && 'Товары для грызунов'}
            </h2>
            </div>
            <div className="category-filters">
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <div className="price-filters">
                <input
                  type="number"
                  placeholder="Мин. цена"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                  className="price-input"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Макс. цена"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                  className="price-input"
                  min="0"
                />
              </div>
              <select 
                value={minRating} 
                onChange={(e) => setMinRating(e.target.value)}
                className="rating-select"
              >
                <option value="">Все рейтинги</option>
                {[5,4,3,2,1].map(n => (
                  <option key={n} value={n}>{n}+ ⭐</option>
                ))}
              </select>
            </div>
            <div className="products-grid">
              {products.filter(product => {
                const category = activeTab === 'dogs' ? 'Собаки' :
                               activeTab === 'cats' ? 'Кошки' :
                               activeTab === 'birds' ? 'Птицы' :
                               activeTab === 'fish' ? 'Рыбы' :
                               activeTab === 'small_pets' ? 'Грызуны' : '';
                return product.category === category;
              }).map(product => (
                <div key={product.id} className="product-card" onClick={() => setActiveTab('product-' + product.id)}>
                  <img src={product.image} alt={product.name} />
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <div className="rating">
                      {'★'.repeat(Math.floor(product.rating))}
                      {'☆'.repeat(5 - Math.floor(product.rating))}
                      <span>({product.reviews})</span>
                    </div>
                    <p className="price">{product.price} ₽</p>
                    <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="add-to-cart">
                      В корзину
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab.startsWith('product-') && (
          <div className="product-details-page">
            <button onClick={() => {
              const productId = activeTab.split('-')[1];
              const product = [...products, ...saleProducts, ...newProducts].find(p => p.id === parseInt(productId));
              const categoryMap = {
                'Собаки': 'dogs',
                'Кошки': 'cats',
                'Птицы': 'birds',
                'Рыбы': 'fish',
                'Грызуны': 'small_pets'
              };
              setActiveTab(product ? categoryMap[product.category] : 'home');
            }} className="back-button">
              ← Назад
            </button>
            {(() => {
              const productId = activeTab.split('-')[1];
              const product = [...products, ...saleProducts, ...newProducts].find(p => p.id === parseInt(productId));

              if (!product) return null;

              const images = product.images ? 
                (typeof product.images === 'string' ? JSON.parse(product.images) : product.images) 
                : [product.image];

              return (
                <div key={product.id} className="product-details">
                  <div className="product-gallery">
                    <div className="main-image">
                      <img src={images[0]} alt={product.name} /> {/* Display the first image */}
                    </div>
                  </div>
                  <div className="product-info-details">
                    <h1>{product.name}</h1>
                    <div className="rating">
                      {'★'.repeat(5)}
                      <span>(0 отзывов)</span>
                    </div>
                    <div className="product-price">
                      {product.isOnSale ? (
                        <>
                          <span className="original-price">{product.price} ₽</span>
                          <span className="sale-price">{product.salePrice} ₽</span>
                        </>
                      ) : (
                        <span>{product.price} ₽</span>
                      )}
                    </div>
                    <div className="product-description">
                      <h3>Описание</h3>
                      <p>{product.description}</p>
                    </div>
                    {product.sizes && (
                      <div className="size-selection">
                        <h3>Выберите размер</h3>
                        <div className="size-options">
                          {product.sizes.split(',').map((size, index) => (
                            <label key={index} className="size-radio">
                              <input
                                type="radio"
                                name="size"
                                value={size.trim()}
                                onChange={(e) => product.selectedSize = e.target.value}
                              />
                              <span>{size.trim()}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    <button onClick={() => {
                      if (product.sizes && !product.selectedSize) {
                        alert('Пожалуйста, выберите размер');
                        return;
                      }
                      addToCart(product);
                    }} className="add-to-cart-large">
                      В корзину
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'support' && (
          <div className="support-page">
            <h2>Служба поддержки</h2>
            <div className="support-container">
              <div className="faq-section">
                <h3>Часто задаваемые вопросы</h3>
                <h4>Как я могу авторизоваться?</h4>
                <p>Нажмите на кнопку "Войти" в правом верхнем углу и авторизуйтесь с помощью электронной почты или номера телефона. Для входа в аккаунт вы можете использовать постоянный пароль или временный одноразовый код, который мы отправим в смс-сообщении.</p>

                <h4>В каком формате вводить номер телефона?</h4>
                <p>При авторизации через одноразовый код, вам необходимо ввести только 10 цифр номера, начиная с 9, код страны +7 вводится автоматически. Если вы авторизуетесь с помощью пароля, можете ввести номер телефона в любом удобном для вас формате, например: +7(911)555-44-33 или 89115554433.</p>

                <h4>Почему не проходит оплата заказа? "Данная транзакция запрещена!"</h4>
                <p>Если Вы видите сообщение "Данная транзакция запрещена! Пожалуйста, обратитесь в торгово-сервисное предприятие для выяснения причин.", ваша оплата блокируется платежной системой, к сожалению, мы не можем на это как-либо повлиять.</p>
                <p>Вы можете попробовать:</p>
                <ol>
                  <li>Совершить оплату из другого местоположения и/или с другого компьютера/смартфона;</li>
                  <li>Обратиться в службу технической поддержки;</li>
                  <li>Выбрать оплату наличными при получении.</li>
                </ol>

                <h4>Почему не проходит оплата? "Платеж с таким номером находится в обработке"</h4>
                <p>Необходимо закрыть все окна с оплатой и повторить попытку оплаты через 20 минут. После этого платежная система позволит повторить оплату. Если это не помогло, обратитесь в службу технической поддержки.</p>

                <h4>Почему не приходит СМС для подтверждения платежа?</h4>
                <p>Пожалуйста, убедитесь, что ваш телефон включен и находится в зоне действия сети, на нем не включен авиарежим. Если все в порядке, попробуйте повторить оплату позднее. СМС для подтверждения платежа отправляется вашим банком или платежной системой. К сожалению, мы никак не можем повлиять на отправку таких СМС.</p>
              </div>

              {user ? (
                <div className="chat-section">
                  <h3>Чат поддержки</h3>
                  <div className="chat-messages">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`message ${msg.is_admin_reply ? 'admin' : 'user'}`}>
                        <p>{msg.message}</p>
                        <span className="message-time">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="chat-input">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Введите сообщение..."
                    />
                    <button onClick={() => {
                      if (newMessage.trim()) {
                        fetch('/api/chat', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'user-id': user.id
                          },
                          body: JSON.stringify({ message: newMessage })
                        })
                        .then(res => res.json())
                        .then(data => {
                          setMessages([data, ...messages]);
                          setNewMessage('');
                        });
                      }
                    }}>Отправить</button>
                  </div>
                </div>
              ) :
              <div className="auth-prompt">
                <p>Пожалуйста, войдите в систему, чтобы использовать чат поддержки</p>
                <button onClick={() => setActiveTab('login')}>Войти</button>
              </div>
            }
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="payment-delivery-page">
            <h2>Доставка и оплата</h2>
            <div className="forms-container">
              <div className="delivery-form">
                <h3>Данные доставки</h3>
                <div className="form-group">
                  <label>ФИО</label>
                  <input type="text" placeholder="Введите ФИО" />
                </div>
                <div className="form-group">
                  <label>Адрес доставки</label>
                  <textarea placeholder="Введите адрес доставки"></textarea>
                </div>
                <div className="form-group">
                  <label>Телефон</label>
                  <input 
                    type="tel" 
                    placeholder="Введите номер телефона" 
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" placeholder="Введите email" />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" name="saveDeliveryData" />
                    Сохранить данные
                  </label>
                </div>
              </div>
              <div className="payment-form">
                <h3>Оплата картой</h3>
                <div className="form-group">
                  <label>Номер карты</label>
                  <input 
                    type="text" 
                    placeholder="0000 0000 0000 0000" 
                    maxLength="19"
                    value={localStorage.getItem('cardNumber') || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (document.querySelector('input[name="saveData"]').checked) {
                        localStorage.setItem('cardNumber', value);
                      }
                    }}
                  />
                </div>
                <div className="form-group card-details">
                  <div>
                    <label>Срок действия</label>
                    <input 
                      type="text" 
                      placeholder="ММ/ГГ" 
                      maxLength="5"
                      value={localStorage.getItem('expiryDate') || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (document.querySelector('input[name="saveData"]').checked) {
                          localStorage.setItem('expiryDate', value);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label>CVV</label>
                    <input 
                      type="password" 
                      placeholder="***" 
                      maxLength="3"
                      value={localStorage.getItem('cvv') || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (document.querySelector('input[name="saveData"]').checked) {
                          localStorage.setItem('cvv', value);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      name="saveData"
                      defaultChecked={localStorage.getItem('savePaymentData') === 'true'}
                      onChange={(e) => {
                        localStorage.setItem('savePaymentData', e.target.checked);
                        if (!e.target.checked) {
                          localStorage.removeItem('cardNumber');
                          localStorage.removeItem('expiryDate');
                          localStorage.removeItem('cvv');
                        }
                      }}
                    />
                    Сохранить данные
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="terms-of-service">
            <h2>Пользовательское соглашение</h2>
            <div className="terms-content">
              <p>Petshop.ru - сайт, расположенный по адресу www.petsshop.ru и на поддоменах в адресной зоне petshop.ru, созданный и действующий с целью реализации (продажи) компанией ООО «Пет Плейс» физическим и юридическим лицам (клиентам) товаров для животных, представленных на указанном сайте, и находящихся в собственности ООО «Пет Плейс» до момента их реализации клиентам (далее – «Сайт»).</p>

              <p>Мобильное приложение интернет-магазина Petshop.ru (далее мобильное приложение) - приложение для мобильных устройств (смартфонов и планшетов на базе операционных систем Android и iOS), расположенное и доступное для скачивания в официальных магазинах Apple Store и Google Play.</p>

              <h3>1. Предоставление информации Клиентом</h3>
              <p>1.1. При регистрации на Сайте и/или в мобильном приложении Клиент предоставляет Обществу информацию о номере своего мобильного телефона.</p>

              <h3>2. Предоставление и передача информации</h3>
              <p>2.1. Общество не осуществляет передачу информации, полученной от Клиента, третьим лицам, за исключением партнеров, действующих на основании договоров с Обществом.</p>

              <h3>3. Обязанности Клиента</h3>
              <p>3.1. Клиент обязуется не сообщать третьим лицам логин и пароль, используемые им для идентификации на Сайте и/или в мобильном приложении.</p>

              <h3>4. Права и обязанности Общества и Клиента</h3>
              <p>4.1. Клиент обязуется:</p>
              <ul>
                <li>периодически проверять наличие обновлений Соглашения</li>
                <li>не использовать Сайт и/или мобильное приложение с целью нарушения законодательства</li>
              </ul>

              <h3>Согласие клиента</h3>
              <p>Соглашаясь со всеми указанными условиями, Клиент будет зарегистрирован на Сайте и/или в мобильном приложении Общества и сможет иметь возможности пользоваться всеми сервисами указанного Сайта и/или мобильного приложения.</p>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="privacy-policy">
            <h2>Политика конфиденциальности</h2>
            <div className="policy-content">
              <p>ООО «Пет Плейс» (далее Petshop или Общество) с уважением относится к правам посетителей сайта petshop.ru и Мобильного приложения интернет-магазина Petshop.ru (далее мобильное приложение).</p>
              <p>Мы безоговорочно признаем важность конфиденциальности личной информации посетителей нашего Сайта и мобильного приложения. Данная страница содержит сведения о том, какую информацию мы получаем и собираем, когда Вы пользуетесь Сайтом и мобильным приложением. Мы надеемся, что эти сведения помогут Вам принимать осознанные решения в отношении предоставляемой нам личной информации.</p>

              <h3>1. Общие положения</h3>
              <p>1.1. Настоящее Положение о Политике конфиденциальности (далее Положение) распространяется только на Сайт и мобильное приложение и на информацию, собираемую этим сайтом, мобильным приложением и через их посредство.</p>
              <p>1.2. Настоящее Положение разработано в соответствии с требованиями Федерального закона «О персональных данных» № 152-ФЗ.</p>
              <p>1.3. Petshop.ru вправе вносить изменения в настоящее Положение в одностороннем порядке без предварительного уведомления и одновременно для всех пользователей.</p>

              <h3>2. Основные понятия</h3><p>2.1. Для целей настоящего Положения используются следующие основные понятия:</p>
              <p>- персональные данные - любая информация, относящаяся прямо или косвенно к определенному или определяемому физическому лицу (субъектом персональных данных)</p>
              <p>- обработка персональных данных клиента - любое действие (операция) или совокупность действий (операций), совершаемых с использованием средств автоматизации или без использования таких средств с персональными данными</p>

              <h3>3. Сбор и обработка персональных данных</h3>
              <p>3.1. Источником информации обо всех персональных данных Пользователя является непосредственно сам Пользователь.</p>
              <p>3.2. Когда Пользователь находится на сайте petshop.ru, или в мобильном приложении Общество сохраняет следующую информацию: имя домена провайдера и страну, сайт, с которого Пользователь перешел на сайт petshop.ru (рефереры)</p>

              <h3>4. Принципы обработки и цели использования персональных данных</h3>
              <p>4.1. Обработка информации обо всех персональных данных Пользователей осуществляется Petshop на основе следующих принципов:</p>
              <p>- законности и справедливой основе;</p>
              <p>- ограничения обработки персональных данных достижением конкретных, заранее определенных и законных целей;</p>

              <h3>5. Права клиентов</h3>
              <p>Клиенты имеют право:</p>
              <p>- получать доступ к своим персональным данным</p>
              <p>- требовать уточнения, блокирования или уничтожения данных</p>
              <p>- отзывать согласие на обработку данных</p>
            </div>
          </div>
        )}
        {activeTab === 'news' && (
          <div className="news-page">
            <h2>Новости</h2>
            <div className="news-list">
              {news.map((newsItem) => (
                <div key={newsItem.id} className="news-item">
                  {newsItem.image && (
                    <div className="news-image">
                      <img src={newsItem.image} alt={newsItem.title} />
                    </div>
                  )}
                  <h3>{newsItem.title}</h3>
                  <div className="news-date">
                    {new Date(newsItem.date).toLocaleDateString()}
                  </div>
                  <p>{newsItem.content}</p>
                </div>
              ))}
            </div>
            {user?.isAdmin && (
              <div className="admin-news-form">
                <h3>Добавить новость</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const title = e.target.title.value;
                  const content = e.target.content.value;
                  const imageFile = e.target.image.files[0];
                  
                  let imageUrl = '';
                  if (imageFile) {
                    const reader = new FileReader();
                    imageUrl = await new Promise((resolve) => {
                      reader.onloadend = () => resolve(reader.result);
                      reader.readAsDataURL(imageFile);
                    });
                  }

                  fetch('/api/news', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'user-id': user.id
                    },
                    body: JSON.stringify({ title, content, image: imageUrl })
                  })
                  .then(res => res.json())
                  .then(() => {
                    // Refresh news
                    fetch('/api/news')
                      .then(res => res.json())
                      .then(setNews);
                    e.target.reset();
                  });
                }}>
                  <input
                    name="title"
                    type="text"
                    placeholder="Заголовок новости"
                    required
                  />
                  <textarea
                    name="content"
                    placeholder="Содержание новости"
                    required
                  ></textarea>
                  <button type="submit">Добавить новость</button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
      <footer className="footer">
        <div className="footer-content">
          <div className="contact">
            <a href="tel:+78123130101">+7 (812) 313-01-01</a>
          </div>
          <div className="footer-links">
            <button onClick={() => setActiveTab('privacy')}>Политика конфиденциальности</button>
            <button onClick={() => setActiveTab('terms')}>Пользовательское соглашение</button>
          </div>
          <div className="copyright">
            © 2007-2025
          </div>
        </div>
      </footer>
    </main>
  );
}