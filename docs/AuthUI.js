class AuthUI {
  constructor() {
    this.container = null;
    this.state = 'login';
    this.apiBaseUrl = this.resolveApiBaseUrl();
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.pendingVerificationEmail = '';
    this.onCloseRequested = null;
  }

  resolveApiBaseUrl() {
    let explicit = '';
    if (typeof window !== 'undefined' && window.__API_BASE_URL__) {
      explicit = String(window.__API_BASE_URL__).trim();
    }
    if (!explicit) {
      let saved = localStorage.getItem('apiBaseUrl');
      if (saved) explicit = String(saved).trim();
    }
    if (explicit) {
      return explicit.replace(/\/+$/, '');
    }

    let origin = window.location.origin;
    let host = window.location.hostname;
    let port = window.location.port;
    let isLocalHost = host === 'localhost' || host === '127.0.0.1';
    if (isLocalHost && port !== '3000') {
      return 'http://localhost:3000';
    }
    return origin;
  }

  isLoggedIn() {
    return !!this.token;
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    location.reload();
  }

  show() {
    if (this.container) return;

    this.container = createDiv('');
    this.container.position(0, 0);
    this.container.size(windowWidth, windowHeight);
    this.container.style('background', 'rgba(0, 0, 0, 0.85)');
    this.container.style('display', 'flex');
    this.container.style('justify-content', 'center');
    this.container.style('align-items', 'center');
    this.container.style('z-index', '1000');

    this.render();
  }

  hide() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  requestClose() {
    this.hide();
    if (typeof this.onCloseRequested === 'function') {
      this.onCloseRequested();
    }
  }

  render() {
    if (!this.container) return;
    this.container.html('');

    let box = createDiv('');
    box.parent(this.container);
    box.addClass('auth-box');
    box.style('position', 'relative');

    let closeBtn = createButton('✕');
    closeBtn.parent(box);
    closeBtn.addClass('auth-close-btn');
    closeBtn.mousePressed(() => this.requestClose());

    let title = createElement('h2', this.getTitle());
    title.parent(box);
    title.addClass('auth-title');

    // Error Message Area
    this.msgBox = createDiv('');
    this.msgBox.parent(box);
    this.msgBox.addClass('auth-msg-error');

    if (this.state === 'login') {
      this.createInput(box, 'email', 'Email', 'email');
      this.createInput(box, 'password', 'Password', 'password', '', () => this.handleLogin());
      this.createButton(box, 'LOGIN', () => this.handleLogin(), 'primary');
      
      let links = createDiv('');
      links.parent(box);
      links.style('margin-top', '20px');
      links.style('font-size', '14px');
      
      let regLink = createSpan('Register');
      regLink.parent(links);
      regLink.addClass('auth-link');
      regLink.mousePressed(() => { this.state = 'register'; this.render(); });

      let forgotLink = createSpan('Forgot Password?');
      forgotLink.parent(links);
      forgotLink.addClass('auth-link');
      forgotLink.mousePressed(() => { this.state = 'forgot'; this.render(); });

    } else if (this.state === 'register') {
      this.createInput(box, 'username', 'Username', 'text');
      this.createInput(box, 'email', 'Email', 'email');
      this.createInput(box, 'password', 'Password', 'password');
      this.createButton(box, 'REGISTER', () => this.handleRegister(), 'primary');

      let links = createDiv('');
      links.parent(box);
      links.style('margin-top', '20px');
      links.style('font-size', '14px');
      
      let loginLink = createSpan('Back to Login');
      loginLink.parent(links);
      loginLink.addClass('auth-link');
      loginLink.mousePressed(() => { this.state = 'login'; this.render(); });

    } else if (this.state === 'verify') {
      let desc = createP('Enter the verification code sent to your email.');
      desc.parent(box);
      desc.style('font-size', '14px');
      desc.style('margin-bottom', '20px');
      desc.style('color', '#bdc3c7');

      this.createInput(box, 'verify-email', 'Email', 'email', this.pendingVerificationEmail);
      this.createInput(box, 'verify-code', 'Verification Code', 'text');
      this.createButton(box, 'VERIFY EMAIL', () => this.handleVerifyCode(), 'primary');
      this.createButton(box, 'RESEND CODE', () => this.handleResendCode(), 'secondary');

      let links = createDiv('');
      links.parent(box);
      links.style('margin-top', '20px');
      links.style('font-size', '14px');

      let loginLink = createSpan('Back to Login');
      loginLink.parent(links);
      loginLink.addClass('auth-link');
      loginLink.mousePressed(() => { this.state = 'login'; this.render(); });

    } else if (this.state === 'forgot') {
      let desc = createP('Enter your email to receive a password reset link.');
      desc.parent(box);
      desc.style('font-size', '14px');
      desc.style('margin-bottom', '20px');
      desc.style('color', '#bdc3c7');

      this.createInput(box, 'email', 'Email', 'email');
      this.createButton(box, 'SEND RESET LINK', () => this.handleForgot(), 'primary');

      let links = createDiv('');
      links.parent(box);
      links.style('margin-top', '20px');
      links.style('font-size', '14px');
      
      let loginLink = createSpan('Back to Login');
      loginLink.parent(links);
      loginLink.addClass('auth-link');
      loginLink.mousePressed(() => { this.state = 'login'; this.render(); });
    }
  }

  createInput(parent, id, placeholder, type, value = '', onEnter = null) {
    let wrapper = createDiv('');
    wrapper.parent(parent);
    wrapper.style('margin-bottom', '15px');
    
    let inp = createElement('input');
    inp.parent(wrapper);
    inp.id('auth-' + id);
    inp.attribute('type', type);
    inp.attribute('placeholder', placeholder);
    if (value) inp.value(value);
    inp.addClass('auth-input');
    if (onEnter) {
      inp.elt.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.repeat) {
          event.preventDefault();
          onEnter();
        }
      });
    }
  }

  createButton(parent, text, onClick, type = 'primary') {
    let btn = createButton(text);
    btn.parent(parent);
    btn.addClass('auth-btn');
    if (type === 'primary') {
        btn.addClass('auth-btn-primary');
    } else {
        btn.addClass('auth-btn-secondary');
    }
    btn.mousePressed(onClick);
  }

  getTitle() {
    if (this.state === 'login') return 'LOGIN';
    if (this.state === 'register') return 'CREATE ACCOUNT';
    if (this.state === 'verify') return 'VERIFY EMAIL';
    if (this.state === 'forgot') return 'RESET PASSWORD';
    return '';
  }

  async handleLogin() {
    let email = select('#auth-email').value();
    let password = select('#auth-password').value();

    if (!email || !password) {
      this.showMessage('Please fill in all fields');
      return;
    }

    this.showMessage('Logging in...', '#f1c40f');

    try {
      let res = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      let data = await res.json();

      if (res.ok) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        this.hide();
        this.onLoginSuccess();
      } else {
        if (res.status === 403) {
          this.pendingVerificationEmail = email;
          this.state = 'verify';
          this.render();
        }
        this.showMessage(data.error || 'Login failed');
      }
    } catch (e) {
      this.showMessage('Network error. Check server.');
      console.error(e);
    }
  }

  async handleRegister() {
    let username = select('#auth-username').value();
    let email = select('#auth-email').value();
    let password = select('#auth-password').value();

    if (!username || !email || !password) {
      this.showMessage('Please fill in all fields');
      return;
    }

    this.showMessage('Registering...', '#f1c40f');

    try {
      let res = await fetch(`${this.apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      let data = await res.json();

      if (res.ok) {
        this.pendingVerificationEmail = email;
        this.state = 'verify';
        this.render();
        this.showMessage(data.message || 'Registration successful. Please verify your email.', '#2ecc71');
      } else {
        this.showMessage(data.error || 'Registration failed');
      }
    } catch (e) {
      this.showMessage('Network error.');
    }
  }

  async handleForgot() {
    let email = select('#auth-email').value();
    if (!email) {
      this.showMessage('Please enter your email');
      return;
    }

    this.showMessage('Sending...', '#f1c40f');

    try {
      let res = await fetch(`${this.apiBaseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      let data = await res.json();

      if (res.ok) {
        this.showMessage(data.message, '#2ecc71');
      } else {
        this.showMessage(data.error || 'Request failed');
      }
    } catch (e) {
      this.showMessage('Network error.');
    }
  }

  async handleVerifyCode() {
    let email = select('#auth-verify-email').value();
    let code = select('#auth-verify-code').value();
    if (!email || !code) {
      this.showMessage('Please enter your email and verification code');
      return;
    }

    this.showMessage('Verifying...', '#f1c40f');
    try {
      let res = await fetch(`${this.apiBaseUrl}/api/auth/verify-email-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      let data = await res.json();
      if (res.ok) {
        this.state = 'login';
        this.pendingVerificationEmail = email;
        this.render();
        this.showMessage('Email verified. Please login now.', '#2ecc71');
      } else {
        this.showMessage(data.error || 'Verification failed');
      }
    } catch (e) {
      this.showMessage('Network error.');
    }
  }

  async handleResendCode() {
    let email = select('#auth-verify-email').value();
    if (!email) {
      this.showMessage('Please enter your email');
      return;
    }

    this.showMessage('Sending code...', '#f1c40f');
    try {
      let res = await fetch(`${this.apiBaseUrl}/api/auth/resend-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      let data = await res.json();
      if (res.ok) {
        this.showMessage(data.message || 'Verification code sent.', '#2ecc71');
      } else {
        this.showMessage(data.error || 'Failed to resend code');
      }
    } catch (e) {
      this.showMessage('Network error.');
    }
  }

  showMessage(msg, color = '#e74c3c') {
    if (this.msgBox) {
      this.msgBox.html(msg);
      this.msgBox.style('color', color);
    }
  }

  onLoginSuccess() {
    console.log('Logged in!');
  }

  async loadProgress() {
    if (!this.token) return null;
    try {
      let res = await fetch(`${this.apiBaseUrl}/api/progress`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to load progress', e);
    }
    return null;
  }

  async saveProgress(data) {
    if (!this.token) return;
    try {
      await fetch(`${this.apiBaseUrl}/api/progress`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(data)
      });
      console.log('Progress saved to server');
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  }
}
