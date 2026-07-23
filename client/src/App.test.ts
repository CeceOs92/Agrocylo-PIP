import { describe, it, expect } from 'vitest';
import App from './App';
import { Button } from './components/ui/Button/Button';
import { Input } from './components/ui/Input/Input';
import { Select } from './components/ui/Select/Select';
import { Card } from './components/ui/Card/Card';
import { Badge } from './components/ui/Badge/Badge';
import { Modal } from './components/ui/Modal/Modal';
import { Spinner } from './components/ui/Spinner/Spinner';
import { Tooltip } from './components/ui/Tooltip/Tooltip';

describe('App & Component Exports', () => {
  it('should verify App is exported as a function', () => {
    expect(typeof App).toBe('function');
  });

  it('should verify Spinner is exported as a function', () => {
    expect(typeof Spinner).toBe('function');
  });

  it('should verify Button is exported as a function', () => {
    expect(typeof Button).toBe('function');
  });

  it('should verify Input is exported as a function', () => {
    expect(typeof Input).toBe('function');
  });

  it('should verify Select is exported as a function', () => {
    expect(typeof Select).toBe('function');
  });

  it('should verify Card is exported as a function', () => {
    expect(typeof Card).toBe('function');
  });

  it('should verify Badge is exported as a function', () => {
    expect(typeof Badge).toBe('function');
  });

  it('should verify Modal is exported as a function', () => {
    expect(typeof Modal).toBe('function');
  });

  it('should verify Tooltip is exported as a function', () => {
    expect(typeof Tooltip).toBe('function');
  });
});
