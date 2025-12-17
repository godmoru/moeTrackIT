import { NativeModule } from 'expo-modules-core';
import { RenderToImageOptions } from '../src/FontUtils.types';
declare class ExpoFontUtils extends NativeModule {
    renderToImageAsync(glyphs: string, options?: RenderToImageOptions): Promise<string>;
}
declare const _default: typeof ExpoFontUtils;
export default _default;
//# sourceMappingURL=ExpoFontUtils.web.d.ts.map