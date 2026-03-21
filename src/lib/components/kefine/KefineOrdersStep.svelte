<script lang="ts">
  import type { OrderView } from './kefine-workflow';

  let {
    tasksQuery,
    filteredOrders,
    formatCreatedAt,
    searchLabel,
    searchPlaceholder,
    tableHeaders,
    noTasksLabel,
    noTasksDescription,
    onQueryInput,
    onOpenOrder,
    onDeleteOrder,
    onCreateNew,
    openButtonLabel,
    deleteLabel,
    actionDeleteAria
  }: {
    tasksQuery: string;
    filteredOrders: OrderView[];
    formatCreatedAt: (value: string) => string;
    searchLabel: string;
    searchPlaceholder: string;
    tableHeaders: {
      task: string;
      solver: string;
      status: string;
      amount: string;
      created: string;
      action: string;
    };
    noTasksLabel: string;
    noTasksDescription: string;
    openButtonLabel: string;
    onQueryInput: (value: string) => void;
    onOpenOrder: (order: OrderView) => void;
    onDeleteOrder: (orderId: string, event: Event) => void;
    onCreateNew: () => void;
    deleteLabel: string;
    actionDeleteAria: string;
  } = $props();
</script>

<article class="kefine-card kefine-card--wide">
  <fieldset>
    <p>
      <label for="task-search">{searchLabel}</label>
      <input
        id="task-search"
        type="search"
        value={tasksQuery}
        oninput={(event) => onQueryInput((event.currentTarget as HTMLInputElement).value)}
        placeholder={searchPlaceholder}
      />
    </p>
  </fieldset>

  {#if filteredOrders.length === 0}
    <section class="kefine-empty-table">
      <h3>{noTasksLabel}</h3>
      <p>{noTasksDescription}</p>
    </section>
  {:else}
    <table class="kefine-table">
      <thead>
        <tr>
          <th scope="col">{tableHeaders.task}</th>
          <th scope="col">{tableHeaders.solver}</th>
          <th scope="col">{tableHeaders.status}</th>
          <th scope="col">{tableHeaders.amount}</th>
          <th scope="col">{tableHeaders.created}</th>
          <th scope="col">{tableHeaders.action}</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredOrders as order (order.id)}
          <tr onclick={() => onOpenOrder(order)}>
            <td>
              <strong>{order.title}</strong>
              <p>{order.id}</p>
              {#if order.executionEstimate}
                <p>{order.executionEstimate}</p>
              {/if}
            </td>
            <td>{order.solver}</td>
            <td><task-status data-status={order.status}>{order.status}</task-status></td>
            <td>{order.estimatedCost ?? '-'} {order.currency}</td>
            <td>{formatCreatedAt(order.createdAt)}</td>
            <td>
              <button
                type="button"
                data-variant="ghost"
                aria-label={`${actionDeleteAria} ${order.id}`}
                onclick={(event) => onDeleteOrder(order.id, event)}
              >
                {deleteLabel}
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  <footer>
    <button type="button" data-variant="primary" onclick={onCreateNew}>{openButtonLabel}</button>
  </footer>
</article>
