import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { WidgetSailChartComponent } from './widget-sail-chart.component';
import { WidgetRuntimeDirective } from '../../core/directives/widget-runtime.directive';
import { WidgetStreamsDirective } from '../../core/directives/widget-streams.directive';
import { WidgetMetadataDirective } from '../../core/directives/widget-metadata.directive';

@Component({
  template: `<widget-sail-chart [id]="id()" [type]="type()" [theme]="theme()" />`,
  imports: [WidgetSailChartComponent, WidgetRuntimeDirective, WidgetStreamsDirective, WidgetMetadataDirective]
})
class HostTestComponent {
  id = signal('test-id');
  type = signal('widget-sail-chart');
  theme = signal<null>(null);
}

describe('WidgetSailChartComponent (Host2)', () => {
  let fixture: ComponentFixture<HostTestComponent>;
  let host: HostTestComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HostTestComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HostTestComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(host).toBeTruthy();
  });
});
