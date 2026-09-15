
import { AfterViewInit, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { IWidgetSvcConfig } from '../../core/interfaces/widgets-interface';
import { WidgetRuntimeDirective } from '../../core/directives/widget-runtime.directive';
import { WidgetStreamsDirective } from '../../core/directives/widget-streams.directive';
import { ITheme } from '../../core/services/app-service';
import { getColors } from '../../core/utils/themeColors.utils';
import { WidgetTitleComponent } from '../../core/components/widget-title/widget-title.component';

@Component({
  selector: 'widget-sail-chart',
  templateUrl: './widget-sail-chart.component.html',
  styleUrls: ['./widget-sail-chart.component.scss'],
  imports: [WidgetTitleComponent, CommonModule, DecimalPipe]
})
export class WidgetSailChartComponent implements AfterViewInit {
  public id = input.required<string>();
  public type = input.required<string>();
  public theme = input.required<ITheme | null>();
  public static readonly DEFAULT_CONFIG: IWidgetSvcConfig & {stepSize?: number} = { // TODO: Update default configuration values as required. See IWidgetSvcConfig interface for all options.
    displayName: "Sail Chart",
    color: "contrast",
    stepSize: 5,
    paths: {
      trueWindAngle: {
        description: 'Wind Angle',
        pathOptions: [
          { label: 'Water', path: 'self.environment.wind.angleTrueWater' },
          { label: 'Ground', path: 'self.environment.wind.angleTrueGround' }
        ],
        path: 'self.environment.wind.angleTrueWater',
        source: 'default',
        pathType: 'number',
        isPathConfigurable: true,
        pathRequired: false,
        showPathSkUnitsFilter: false,
        pathSkUnitsFilter: 'rad',
        convertUnitTo: 'deg',
        showConvertUnitTo: false
      },
      trueWindSpeed: {
        description: 'True Wind Speed',
        path: 'self.environment.wind.speedTrue',
        source: 'default',
        pathType: 'number',
        isPathConfigurable: false,
        pathRequired: false,
        showPathSkUnitsFilter: false,
        pathSkUnitsFilter: 'm/s',
        convertUnitTo: 'knots'
      }
    },
    filterSelfPaths: true,
    updateInterval: 1000,
    enableTimeout: false,
    dataTimeout: 5
  };

  protected readonly runtime = inject(WidgetRuntimeDirective);
  private readonly streams = inject(WidgetStreamsDirective);

  protected titleColor = signal<string | undefined>(undefined);

  protected trueWindAngle = signal(0);
  protected trueWindSpeed = signal(0);
  protected sailChartMatrix: (string | number)[][] = [];

  protected get stepSize(): number {
    const options = this.runtime.options() as IWidgetSvcConfig & { stepSize?: number };
    return options?.stepSize ?? 5;
  }

  protected crosshairX = computed(() => {
    const tws = this.trueWindSpeed();
    const minTws = 0;
    const maxTws = 25;
    const clamped = Math.max(minTws, Math.min(maxTws, tws));
    return 40 + ((clamped - minTws) / (maxTws - minTws)) * 330;
  })

  protected crosshairY = computed(() => {
    const twa = this.trueWindAngle();
    const minTwa = 20;
    const maxTwa = 180;
    const clamped = Math.max(minTwa, Math.min(maxTwa, twa));
    return 30 + ((clamped - minTwa) / (maxTwa - minTwa)) * 210;
  })

  // Section about the colors
  protected sailColorMap = computed(() => {
    const matrix = this.sailChartMatrix;
    if (matrix.length === 0) return new Map<string, string>();

    const aSails = new Set<string>();
    const jSails = new Set<string>();
    const otherSails = new Set<string>();

    for (let r = 1; r < matrix.length; r++) {
      for (let c = 1; c < matrix[r].length; c++) {
        const val = String(matrix[r][c]).trim();
        if (val && val !== '---') {
          const firstChar = val.charAt(0).toUpperCase();
          if (firstChar === 'A') {
            aSails.add(val);
          } else if (firstChar === 'J') {
            jSails.add(val);
          } else {
            otherSails.add(val)
          }
        }
      }
    }

    const sortedA = Array.from(aSails).sort();
    const sortedJ = Array.from(jSails).sort();
    const sortedOther = Array.from(otherSails).sort();

    const map = new Map<string, string>();

    sortedA.forEach((sail, index) => {
      const total = Math.max(1, sortedA.length - 1);
      const hue = (index / total) * 35;
      map.set(sail, `hsla(${Math.round(hue)}, 70%, 45%, 0.45)`);
    });

    sortedJ.forEach((sail, index) => {
      const total = Math.max(1, sortedJ.length - 1);
      const hue = 140 + (index / total) * 80;
      map.set(sail, `hsla(${Math.round(hue)}, 70%, 45%, 0.45)`);
    });

    sortedOther.forEach((sail, index) => {
      const total = Math.max(1, sortedOther.length - 1);
      const hue = 55 + (index / total) * 70;
      map.set(sail, `hsla(${Math.round(hue)}, 70%, 45%, 0.45)`);
    });

    return map;
  });

  protected getCellColor(cell: string | number): string {
    const val = String(cell).trim();
    return this.sailColorMap().get(val) || 'rgba(100, 100, 100, 0.15)';
  }


  constructor() {
    effect(() => {
      const theme = this.theme();
      const cfg = this.runtime.options();
      if (!theme || !cfg) return;

      untracked(() => {
        this.titleColor.set(getColors(this.runtime.options()?.color ?? 'contrast', theme).dim); // TODO: Themes are either, Dark, Light or Red Night mode. Add signals to include more colors and variants in your template.
      });
    });

    effect(() => { // React to widget Options configuration changes.
      const cfg = this.runtime.options();
      if (!cfg) return;
      untracked(() => {
        const twaCfg = cfg.paths?.['trueWindAngle'];
        if (twaCfg && twaCfg.path) {
          this.streams.observe('trueWindAngle', path => {
            if (path && path.data) {
              this.trueWindAngle.set(path.data.value);
            }
          });
        }
        const twsCfg = cfg.paths?.['trueWindSpeed'];
        if (twsCfg && twsCfg.path) {
          this.streams.observe('trueWindSpeed', path => {
            if (path && path.data) {
              this.trueWindSpeed.set(path.data.value);
            }
          });
        }
      });
    });
  }

  ngAfterViewInit() {
    this.loadSailChartCsv();
  }


  private loadSailChartCsv() {
    const options = this.runtime.options() as Record<string, unknown>;
    const stepSize = Number(options?.['stepSize']) || 5;

    fetch('./assets/best_sails.csv')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error. Status: ${response.status}`);
        }
        return response.text();
      })
      .then(csvText => {
        const rawRows = csvText.trim().split('\n');
        const processedRows: (string | number)[][] = [];

        rawRows.forEach((rowText, rowIndex) => {
          const cols = rowText.split(',').map(cell => cell.trim());
          if (rowIndex == 0) {
            processedRows.push(cols);
            return;
          }
          const rad = parseFloat(cols[0]);
          if (isNaN(rad)) return;

          const deg = Math.round(rad * (180 / Math.PI));

          if (deg < 20) {
            return;
          }

          if (deg % stepSize !== 0) {
            return;
          }

          const finalRow = cols.map((cell, colIndex) => {
            if (colIndex == 0) {
              return deg;
            }
            return cell;
          });

          processedRows.push(finalRow);
        });
        this.sailChartMatrix = processedRows;
        console.log('Converted Sail Chart Matrix (Angles into Degrees):', this.sailChartMatrix);
      })
      .catch(error => {
        console.error("Failed to load sail chart from assets", error);
      });
  }
}
