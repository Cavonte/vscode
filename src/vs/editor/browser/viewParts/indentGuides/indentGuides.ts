/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./indentGuides';
import { DynamicViewOverlay } from 'vs/editor/browser/view/dynamicViewOverlay';
import { ViewContext } from 'vs/editor/common/view/viewContext';
import { RenderingContext } from 'vs/editor/common/view/renderingContext';
import * as viewEvents from 'vs/editor/common/view/viewEvents';
import { registerThemingParticipant } from 'vs/platform/theme/common/themeService';
import { editorIndentGuides } from 'vs/editor/common/view/editorColorRegistry';
import { Position } from 'vs/editor/common/core/position';

export class IndentGuidesOverlay extends DynamicViewOverlay {

	private _context: ViewContext;
	private _lineHeight: number;
	private _spaceWidth: number;
	private _renderResult: string[];
	private _enabled: boolean;

	constructor(context: ViewContext) {
		super();
		this._context = context;
		this._lineHeight = this._context.configuration.editor.lineHeight;
		this._spaceWidth = this._context.configuration.editor.fontInfo.spaceWidth;
		this._enabled = this._context.configuration.editor.viewInfo.renderIndentGuides;
		this._renderResult = null;

		this._context.addEventHandler(this);
	}

	public dispose(): void {
		this._context.removeEventHandler(this);
		this._context = null;
		this._renderResult = null;
		super.dispose();
	}

	// --- begin event handlers

	public onConfigurationChanged(e: viewEvents.ViewConfigurationChangedEvent): boolean {
		if (e.lineHeight) {
			this._lineHeight = this._context.configuration.editor.lineHeight;
		}
		if (e.fontInfo) {
			this._spaceWidth = this._context.configuration.editor.fontInfo.spaceWidth;
		}
		if (e.viewInfo) {
			this._enabled = this._context.configuration.editor.viewInfo.renderIndentGuides;
		}
		return true;
	}
	public onDecorationsChanged(e: viewEvents.ViewDecorationsChangedEvent): boolean {
		// true for inline decorations
		return true;
	}
	public onFlushed(e: viewEvents.ViewFlushedEvent): boolean {
		return true;
	}
	public onLinesChanged(e: viewEvents.ViewLinesChangedEvent): boolean {
		return true;
	}
	public onLinesDeleted(e: viewEvents.ViewLinesDeletedEvent): boolean {
		return true;
	}
	public onLinesInserted(e: viewEvents.ViewLinesInsertedEvent): boolean {
		return true;
	}
	public onScrollChanged(e: viewEvents.ViewScrollChangedEvent): boolean {
		return e.scrollTopChanged;// || e.scrollWidthChanged;
	}
	public onZonesChanged(e: viewEvents.ViewZonesChangedEvent): boolean {
		return true;
	}
	public onLanguageConfigurationChanged(e: viewEvents.ViewLanguageConfigurationEvent): boolean {
		return true;
	}

	// --- end event handlers

	public prepareRender(ctx: RenderingContext): void {
		if (!this._enabled) {
			this._renderResult = null;
			return;
		}

		const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
		const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
		const tabSize = this._context.model.getTabSize();
		const tabWidth = tabSize * this._spaceWidth;
		const lineHeight = this._lineHeight;
		const indentGuideWidth = tabWidth;

		const indents = this._context.model.getLinesIndentGuides(visibleStartLineNumber, visibleEndLineNumber);

		let output: string[] = [];
		for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
			const lineIndex = lineNumber - visibleStartLineNumber;
			const indent = indents[lineIndex];

			let result = '';
			let leftMostVisiblePosition = ctx.visibleRangeForPosition(new Position(lineNumber, 1));
			let left = leftMostVisiblePosition ? leftMostVisiblePosition.left : 0;
			for (let i = 0; i < indent; i++) {
				result += `<div class="cigr" style="left:${left}px;height:${lineHeight}px;width:${indentGuideWidth}px"></div>`;
				left += tabWidth;
			}

			output[lineIndex] = result;
		}
		this._renderResult = output;
	}

	public render(startLineNumber: number, lineNumber: number): string {
		if (!this._renderResult) {
			return '';
		}
		let lineIndex = lineNumber - startLineNumber;
		if (lineIndex < 0 || lineIndex >= this._renderResult.length) {
			return '';
		}
		return this._renderResult[lineIndex];
	}
}

registerThemingParticipant((theme, collector) => {
	let editorGuideColor = theme.getColor(editorIndentGuides);
	if (editorGuideColor) {
		collector.addRule(`.monaco-editor .lines-content .cigr { box-shadow: 1px 0 0 0 ${editorGuideColor} inset; }`);
	}
});
