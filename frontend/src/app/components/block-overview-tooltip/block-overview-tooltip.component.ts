import { Component, ElementRef, ViewChild, Input, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Position } from '../../components/block-overview-graph/sprite-types.js';
import { Price } from '../../services/price.service';
import { TransactionStripped } from '../../interfaces/node-api.interface.js';
import { Filter, FilterMode, TransactionFlags, toFilters } from '../../shared/filters.utils';

@Component({
  selector: 'app-block-overview-tooltip',
  templateUrl: './block-overview-tooltip.component.html',
  styleUrls: ['./block-overview-tooltip.component.scss'],
})
export class BlockOverviewTooltipComponent implements OnChanges {
  @Input() tx: TransactionStripped | void;
  @Input() cursorPosition: Position;
  @Input() clickable: boolean;
  @Input() auditEnabled: boolean = false;
  @Input() blockConversion: Price;
  @Input() filterFlags: bigint | null = null;
  @Input() filterMode: FilterMode = 'and';

  txid = '';
  fee = 0;
  value = 0;
  vsize = 1;
  feeRate = 0;
  effectiveRate;
  acceleration;
  hasEffectiveRate: boolean = false;
  filters: Filter[] = [];
  activeFilters: { [key: string]: boolean } = {};

  tooltipPosition: Position = { x: 0, y: 0 };

  @ViewChild('tooltip') tooltipElement: ElementRef<HTMLCanvasElement>;

  constructor(
    private cd: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes): void {
    if (changes.cursorPosition && changes.cursorPosition.currentValue) {
      let x = changes.cursorPosition.currentValue.x + 10;
      let y = changes.cursorPosition.currentValue.y + 10;
      if (this.tooltipElement) {
        const elementBounds = this.tooltipElement.nativeElement.getBoundingClientRect();
        const parentBounds = this.tooltipElement.nativeElement.offsetParent.getBoundingClientRect();
        if ((parentBounds.left + x + elementBounds.width) > parentBounds.right) {
          x = Math.max(0, parentBounds.width - elementBounds.width - 10);
        }
        if (y + elementBounds.height > parentBounds.height) {
          y = y - elementBounds.height - 20;
        }
      }
      this.tooltipPosition = { x, y };
    }

    if (this.tx && (changes.tx || changes.filterFlags || changes.filterMode)) {
      this.txid = this.tx.txid || '';
      this.fee = this.tx.fee || 0;
      this.value = this.tx.value || 0;
      this.vsize = this.tx.vsize || 1;
      this.feeRate = this.fee / this.vsize;
      this.effectiveRate = this.tx.rate;
      this.acceleration = this.tx.acc;
      const txFlags = BigInt(this.tx.flags) || 0n;
      this.hasEffectiveRate = Math.abs((this.fee / this.vsize) - this.effectiveRate) > 0.05
        || (txFlags && (txFlags & (TransactionFlags.cpfp_child | TransactionFlags.cpfp_parent)) > 0n);
      this.filters = this.tx.flags ? toFilters(txFlags).filter(f => f.tooltip) : [];
      this.activeFilters = {}
      for (const filter of this.filters) {
        if (this.filterFlags && (this.filterFlags & BigInt(filter.flag))) {
          this.activeFilters[filter.key] = true;
        }
      }
      this.cd.markForCheck();
    }
  }
}
