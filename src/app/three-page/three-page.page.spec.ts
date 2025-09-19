import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThreePagePage } from './three-page.page';

describe('ThreePagePage', () => {
  let component: ThreePagePage;
  let fixture: ComponentFixture<ThreePagePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreePagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
