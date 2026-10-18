import { writable } from 'svelte/store';
export let repeat_mix = writable(true);
export let global_volume = writable(1);
export let is_playing = writable(false);
export let dark_mode = writable(true);
// `n` makes repeated identical requests distinct store values; no `track_id` means play from the start
export let play_request = writable<{ mix_id: number, track_id?: number, n: number } | null>(null);
export type TransportAction = 'toggle' | 'next' | 'prev';
// `n` makes repeated identical actions distinct store values
export let transport_command = writable<{ action: TransportAction, n: number } | null>(null);