import { readFileSync } from 'node:fs';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { encodeUrlValue } from '../src/hooks/useUrlState';

// The real 500-car sample; a 3-car stand-in for the full file.
const sample = readFileSync(`${process.cwd()}/public/cars-sample.json`, 'utf8');
const sampleCars = (JSON.parse(sample) as { cars: Array<{ brand: { name: string } }> }).cars;
const fullCars = { cars: [{ model: 'A', brand: { name: 'Toyota' } }, { model: 'B', brand: { name: 'Honda' } }, { model: 'C', brand: { name: 'Toyota' } }] };

const fetchMock = vi.fn(async (url: string) => {
  const body = url === '/cars-sample.json' ? sample : url === '/cars.json' ? JSON.stringify(fullCars) : null;
  return body === null ? new Response('not found', { status: 404, statusText: 'Not Found' }) : new Response(body);
});

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

async function totalResults(): Promise<string> {
  const label = await screen.findByText('Total Results:');
  return label.nextElementSibling?.textContent ?? '';
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockClear();
  window.history.replaceState({}, '', '/');
  // jsdom has no matchMedia.
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.className = '';
});

describe('App', () => {
  it('loads only the sample at startup and runs the default query', async () => {
    renderApp();
    await waitFor(async () => expect(await totalResults()).toBe('10'));
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/cars-sample.json']);
    expect(screen.getByRole('button', { name: /Cars sample \(500 cars\)/ })).toBeInTheDocument();
    expect(screen.getByTestId('library-version')).toHaveTextContent(/^v\d+\.\d+\.\d+/);
  });

  it('runs filter examples without eval and records them in the history', async () => {
    const user = userEvent.setup();
    renderApp();
    await waitFor(async () => expect(await totalResults()).toBe('10'));

    await user.click(screen.getByRole('button', { name: /Toyota Cars/ }));
    const toyotas = sampleCars.filter((c) => c.brand.name === 'Toyota').length;
    await waitFor(async () => expect(await totalResults()).toBe(toyotas.toLocaleString()));

    // The URL carries the query, and the history entry has this query's count.
    expect(new URLSearchParams(window.location.search).get('q')).toBe(encodeUrlValue('$[?(@.brand.name == "Toyota")]'));
    await waitFor(() => {
      const history = JSON.parse(localStorage.getItem('jsonpathx_query_history') ?? '[]') as Array<{ query: string; resultCount: number }>;
      expect(history[0]).toMatchObject({ query: '$[?(@.brand.name == "Toyota")]', resultCount: toyotas });
    });
    // Each run is recorded with its own count (not the previous query's).
    const history = JSON.parse(localStorage.getItem('jsonpathx_query_history')!) as Array<{ query: string; resultCount: number }>;
    expect(history.find((h) => h.query === '$[0:10]')?.resultCount).toBe(10);
  });

  it('restores the query from the URL', async () => {
    window.history.replaceState({}, '', `/?q=${encodeUrlValue('$[-5:]')}`);
    renderApp();
    await waitFor(async () => expect(await totalResults()).toBe('5'));
    expect(screen.getByLabelText('JSONPath Expression')).toHaveValue('$[-5:]');
  });

  it('fetches the full dataset only when it is chosen', async () => {
    const user = userEvent.setup();
    renderApp();
    await waitFor(async () => expect(await totalResults()).toBe('10'));

    await user.click(screen.getByRole('button', { name: /Cars sample \(500 cars\)/ }));
    await user.click(screen.getByRole('button', { name: /Cars, full dataset/ }));
    await waitFor(async () => expect(await totalResults()).toBe('3'));
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/cars-sample.json', '/cars.json']);
  });

  it('shows an error with a way back when a dataset fails to load', async () => {
    fetchMock.mockImplementationOnce(async () => new Response('nope', { status: 500, statusText: 'Server Error' }));
    const user = userEvent.setup();
    renderApp();
    expect(await screen.findByText('Error Loading Data')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Load the Sample Dataset' }));
    await waitFor(async () => expect(await totalResults()).toBe('10'));
  });

  it('cycles the theme and remembers it', async () => {
    const user = userEvent.setup();
    renderApp();
    await waitFor(async () => expect(await totalResults()).toBe('10'));
    const toggle = () => screen.getByRole('button', { name: /^Theme toggle/ });

    expect(toggle()).toHaveAccessibleName('Theme toggle - Current: Auto');
    await user.click(toggle());
    expect(toggle()).toHaveAccessibleName('Theme toggle - Current: Light');
    expect(document.documentElement).not.toHaveClass('dark');
    await user.click(toggle());
    expect(toggle()).toHaveAccessibleName('Theme toggle - Current: Dark');
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('jsonpathx-theme')).toBe('dark');
  });

  it('opens the shortcuts help and the analytics from the keyboard', async () => {
    const user = userEvent.setup();
    renderApp();
    await waitFor(async () => expect(await totalResults()).toBe('10'));

    await user.keyboard('{Control>}/{/Control}');
    expect(await screen.findByText('Execute current query')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Execute current query')).not.toBeInTheDocument());

    await user.keyboard('{Control>}p{/Control}');
    expect(await screen.findByText('Performance Analytics')).toBeInTheDocument();
  });

  it('searches within results and highlights matches safely', async () => {
    const user = userEvent.setup();
    renderApp();
    await waitFor(async () => expect(await totalResults()).toBe('10'));

    await user.type(screen.getByRole('searchbox', { name: 'Search within results' }), 'Mehran');
    await waitFor(() => expect(document.querySelectorAll('mark.search-highlight').length).toBeGreaterThan(0));
  });

  it('loads an uploaded JSON file as a new dataset', async () => {
    const user = userEvent.setup();
    renderApp();
    await waitFor(async () => expect(await totalResults()).toBe('10'));

    await user.keyboard('{Control>}u{/Control}');
    const file = new File([JSON.stringify([{ id: 1 }, { id: 2 }])], 'mine.json', { type: 'application/json' });
    await user.upload(await screen.findByLabelText('Choose a JSON file'), file);
    await user.click(await screen.findByRole('button', { name: 'Use This Dataset' }));
    await act(async () => {});
    await waitFor(async () => expect(await totalResults()).toBe('2'));
    expect(screen.getAllByRole('button').some((b) => b.textContent?.includes('2 items'))).toBe(true);
  });
});
