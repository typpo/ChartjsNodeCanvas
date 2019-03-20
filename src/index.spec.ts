import * as assert from 'assert';
import { writeFile } from 'fs';
import { promisify } from 'util';
import { describe, it } from 'mocha';
import { ChartConfiguration } from 'chart.js';

import { CanvasRenderService, ChartCallback } from './';

const writeFileAsync = promisify(writeFile);

describe('app', () => {

	const width = 400;
	const height = 400;
	const configuration: ChartConfiguration = {
		type: 'bar',
		data: {
			labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
			datasets: [{
				label: '# of Votes',
				data: [12, 19, 3, 5, 2, 3],
				backgroundColor: [
					'rgba(255, 99, 132, 0.2)',
					'rgba(54, 162, 235, 0.2)',
					'rgba(255, 206, 86, 0.2)',
					'rgba(75, 192, 192, 0.2)',
					'rgba(153, 102, 255, 0.2)',
					'rgba(255, 159, 64, 0.2)'
				],
				borderColor: [
					'rgba(255,99,132,1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)',
					'rgba(75, 192, 192, 1)',
					'rgba(153, 102, 255, 1)',
					'rgba(255, 159, 64, 1)'
				],
				borderWidth: 1
			}]
		},
		options: {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						callback: (value: number) => '$' + value
					} as any
				}]
			}
		}
	};
	const chartCallback: ChartCallback = (ChartJS) => {

		ChartJS.defaults.global.responsive = true;
		ChartJS.defaults.global.maintainAspectRatio = false;
	};

	it('renders image', async () => {
		const canvasRenderService = new CanvasRenderService(width, height, undefined, chartCallback);
		const image = await canvasRenderService.renderToBuffer(configuration);
		assert.equal(image instanceof Buffer, true);
	});

	it.skip('test image', async () => {
		const canvasRenderService = new CanvasRenderService(width, height, undefined, chartCallback);
		const image = await canvasRenderService.renderToBuffer(configuration);
		await writeFileAsync('./test.png', image);
	});

	it('renders buffer in parallel', async () => {
		const canvasRenderService = new CanvasRenderService(width, height, undefined, chartCallback);
		const promises = Array(3).fill(undefined).map(() => canvasRenderService.renderToBuffer(configuration));
		const images = await Promise.all(promises);
		images.forEach((image) => assert.equal(image instanceof Buffer, true));
	});

	it('renders data url', async () => {
		const canvasRenderService = new CanvasRenderService(width, height, undefined, chartCallback);
		const dataUrl = await canvasRenderService.renderToDataURL(configuration);
		assert.equal(dataUrl.startsWith('data:image/png;base64,'), true);
	});

	it('renders data url in parallel', async () => {
		const canvasRenderService = new CanvasRenderService(width, height, undefined, chartCallback);
		const promises = Array(3).fill(undefined).map(() => canvasRenderService.renderToDataURL(configuration));
		const dataUrls = await Promise.all(promises);
		dataUrls.forEach((dataUrl) => assert.equal(dataUrl.startsWith('data:image/png;base64,'), true));
	});

	it('renders stream', (done) => {
		const canvasRenderService = new CanvasRenderService(width, height, undefined, chartCallback);
		const stream = canvasRenderService.renderToStream(configuration);
		const data: Array<Buffer> = [];
		stream.on('data', (chunk: Buffer) => {
			data.push(chunk);
		});
		stream.on('end', () => {
			assert.equal(Buffer.concat(data).length > 0, true);
			done();
		});
		stream.on('error', (error) => {
			done(error);
		});
	});
});
