import { h } from 'preact';
import { useState } from 'preact/hooks';
import '../styles/Auth.css';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    // Handle signup logic
  };

  return (
    <div class="form-container">
      <div class="social-buttons">
        <button class="social-button google">
          <i class="fab fa-google"></i>
          SIGN UP WITH GOOGLE
        </button>
        <button class="social-button facebook">
          <i class="fab fa-facebook"></i>
          SIGN UP WITH FACEBOOK
        </button>
        <button class="social-button spotify">
          <i class="fab fa-spotify"></i>
          SIGN UP WITH SPOTIFY
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
        <input
          type="password"
          placeholder="CONFIRM PASSWORD"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.currentTarget.value)}
        />
        <button type="submit" class="submit-button">
          SIGN UP
        </button>
      </form>

      {error && <div class="error">{error}</div>}

      <div class="auth-footer">
        <span>ALREADY HAVE AN ACCOUNT?</span>
        <a href="/login">LOGIN</a>
      </div>
    </div>
  );
}