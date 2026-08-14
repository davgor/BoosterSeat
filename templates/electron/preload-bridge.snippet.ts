/**
 * Minimal preload bridge. Expose only explicit APIs — never raw ipcRenderer.
 * Renderer: declare window.api in a d.ts and call window.api.getVersion().
 */
import { contextBridge, ipcRenderer } from 'electron';

const api = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
};

contextBridge.exposeInMainWorld('api', api);

export type PreloadApi = typeof api;
