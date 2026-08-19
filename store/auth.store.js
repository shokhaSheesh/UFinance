import { makeAutoObservable } from 'mobx';
import { makePersistable } from 'mobx-persist-store';

class AuthStore {
  isAuthenticated = false;
  userEmail = '';
  userData = null;
  authToken = '';
  refreshToken = '';
  branches = [];
  branch_id = ''
  selectBranch = null

  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: 'authStore',
      properties: ['isAuthenticated', 'userEmail', 'userData', 'authToken', 'refreshToken', 'branches', 'branch_id', 'selectBranch'],
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    });
  }

  // // Restore state from localStorage/cookies on init
  // hydrate() {
  //   if (typeof window !== 'undefined') {
  //     this.isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  //     this.userEmail = localStorage.getItem('userEmail') || '';
  //     this.authToken = localStorage.getItem('authToken') || '';
  //     this.refreshToken = localStorage.getItem('refreshToken') || '';

  //     const storedUserData = localStorage.getItem('userData');
  //     if (storedUserData) {
  //       try {
  //         this.userData = JSON.parse(storedUserData);
  //       } catch (e) {
  //         console.error('Failed to parse userData from localStorage', e);
  //       }
  //     }
  //   }
  // }

  setAuthentication(data) {
    this.isAuthenticated = true;

    // Handle new auth API response structure
    if (data?.token) {
      this.authToken = data.token;
      localStorage.setItem('authToken', this.authToken);
    } else {
      console.warn('No token in data:', data);
    }

    if (data?.refresh_token) {
      this.refreshToken = data.refresh_token;
      localStorage.setItem('refreshToken', this.refreshToken);
    }

    if (data?.user_data) {
      this.userData = data.user_data;
      // Use email field from user_data
      this.userEmail = data.user_data.email || data.user_data.login || '';
      localStorage.setItem('userData', JSON.stringify(this.userData));
      localStorage.setItem('userEmail', this.userEmail);
    }

    localStorage.setItem('isAuthenticated', 'true');
    document.cookie = 'isAuthenticated=true; path=/; max-age=86400';

  }

  setToken(tokenName, token) {
    this[tokenName] = token;
  }

  setCompanyId(companyId) {
    this.userData = { ...this.userData, company_id: companyId };
  }

  setBranchId(branchId) {
    this.branch_id = branchId;
  }

  setBranches(branches) {
    this.branches = branches;
  }

  setSelectBranch(branch) {
    this.selectBranch = branch;
  }

  logout() {
    this.isAuthenticated = false;
    this.userEmail = '';
    this.userData = null;
    this.authToken = '';
    this.refreshToken = '';
    this.selectBranch = null;
    this.branch_id = '';
    this.branches = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      // ключ mobx-persist со всем состоянием стора (в т.ч. токенами)
      localStorage.removeItem('authStore');
      document.cookie = 'isAuthenticated=; path=/; max-age=0';
    }
  }
}

export const authStore = new AuthStore();
