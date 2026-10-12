import { writable } from 'svelte/store';
export let repeat_mix = writable(true);
export let global_volume = writable(1);
export let is_playing = writable(false);
export type TransportAction = 'toggle' | 'next' | 'prev';
// `n` makes repeated identical actions distinct store values
export let transport_command = writable<{ action: TransportAction, n: number } | null>(null);