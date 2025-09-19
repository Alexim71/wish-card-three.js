import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThreeBookPage } from './three-book.page';

describe('ThreeBookPage', () => {
  let component: ThreeBookPage;
  let fixture: ComponentFixture<ThreeBookPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreeBookPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
