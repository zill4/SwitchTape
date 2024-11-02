import { h } from 'preact';
import { useState } from 'preact/hooks';
import '../styles/Auth.css';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    // Handle login logic
  };

  return (
    <div class="form-container">
      <div class="social-buttons">
        <button class="social-button google">
          <i class="fab fa-google"></i>
          CONTINUE WITH GOOGLE
        </button>
        <button class="social-button facebook">
          <i class="fab fa-facebook"></i>
          CONTINUE WITH FACEBOOK
        </button>
        <button class="social-button spotify">
          <i class="fab fa-spotify"></i>
          CONTINUE WITH SPOTIFY
        </button>
      </div>

      <div class="divider">
        <span>OR</span>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="EMAIL"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />
        <input
          type="password"
          placeholder="PASSWORD"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />
        <button type="submit" class="submit-button">
          LOGIN
        </button>
      </form>

      {error && <div class="error">{error}</div>}

      <div class="auth-footer">
        <span>DON'T HAVE AN ACCOUNT?</span>
        <a href="/signup">SIGN UP</a>
      </div>
    </div>
  );
}