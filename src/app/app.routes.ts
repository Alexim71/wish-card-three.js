import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'three-book',
    pathMatch: 'full',
  },
  {
    path: 'three-page',
    loadComponent: () => import('./three-page/three-page.page').then( m => m.ThreePagePage)
  },
  {
    path: 'three-book',
    loadComponent: () => import('./three-book/three-book.page').then( m => m.ThreeBookPage)
  },
];
