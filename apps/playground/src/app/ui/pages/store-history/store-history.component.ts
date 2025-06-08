import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreHistoryEvent, STORE_HISTORY_SERVICE, IStoreHistoryService } from '@smz-ui/store';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-store-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Store History</h1>
        <button
          (click)="loadEvents()"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <span class="material-icons text-sm mr-1">refresh</span>
          Refresh
        </button>
      </div>

      <div class="mb-4">
        <label for="storeSelect" class="block text-sm font-medium text-gray-700 mb-2">
          Select Store
        </label>
        <select
          id="storeSelect"
          [(ngModel)]="selectedStore"
          (ngModelChange)="onStoreChange()"
          class="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Stores</option>
          <option *ngFor="let store of availableStores" [value]="store">
            {{ store }}
          </option>
        </select>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Params</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let event of filteredEvents">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ event.storeScope }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ event.action }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ event.params | json }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  [class]="getStatusClass(event.status)"
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                >
                  {{ event.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ event.timestamp | date:'medium' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class StoreHistoryComponent implements OnInit, OnDestroy {
  private storeHistory: IStoreHistoryService = inject(STORE_HISTORY_SERVICE);
  events: StoreHistoryEvent[] = [];
  filteredEvents: StoreHistoryEvent[] = [];
  availableStores: string[] = [];
  selectedStore = '';
  private refreshInterval!: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.loadEvents();
    // Auto-refresh a cada 2 segundos
    this.refreshInterval = setInterval(() => this.loadEvents(), 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadEvents(): void {
    this.events = this.storeHistory.getAllEvents();
    this.availableStores = [...new Set(this.events.map(e => e.storeScope))];
    this.filterEvents();
  }

  onStoreChange(): void {
    this.filterEvents();
  }

  private filterEvents(): void {
    this.filteredEvents = this.selectedStore
      ? this.events.filter(e => e.storeScope === this.selectedStore)
      : this.events;
  }

  getStatusClass(status: string): string {
    const baseClass = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
    switch (status) {
      case 'loading':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'resolved':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'error':
        return `${baseClass} bg-red-100 text-red-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  }
}