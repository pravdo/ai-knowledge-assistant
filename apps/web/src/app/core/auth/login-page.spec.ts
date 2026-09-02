import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  it('calls AuthService.login() when the button is clicked', () => {
    const login = vi.fn();
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [{ provide: AuthService, useValue: { login } }],
    });

    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(login).toHaveBeenCalledOnce();
  });
});
