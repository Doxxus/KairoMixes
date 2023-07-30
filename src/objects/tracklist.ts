import { type Track } from '../objects/track';

export type Tracklist = {
    id: number,
    name: string,
    tracks: Track[];
}