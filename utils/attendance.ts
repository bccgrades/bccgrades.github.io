interface Absense {
	date: Date;
	periods: {
		name: string;
		period: number;
	}[];
}

interface Attendance {
	type: string;
	periodInfos: {
		period: number;
		total: {
			[key: string]: number;
		};
	}[];
	absences: Absense[];
}

const chartOptions = {
	elements: {
		bar: {
			borderWidth: 1,
		},
	},
	plugins: {
		// title: {
		// 	display: true,
		// 	text: "Attendance",
		// },
		legend: {
			labels: {
				font: {
					family: "Manrope",
				},
			},
		},
	},
	responsive: true,
	scales: {
		x: {
			stacked: true,
		},
		y: {
			stacked: true,
		},
	},
};

const getColor = (label: string) => {
	if (label.includes("Absent")) return "#FF7F7F";
	if (label.includes("Exc")) return "#FFEC1F";
	if (label.includes("Illness")) return "#ADD8E6";
	if (label.includes("Activities")) return "#50C878";
	if (label.includes("Supervision")) return "#50C878";
	if (label.includes("Tardy")) return "#FA8A20";
	return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
};

const parsePeriods = (absences: Absense[]): string[] => {
	if (!absences) return [];
	let periodLabels: string[] = [];

	absences.forEach(({ periods }, i) => {
		periods.forEach((period) => {
			if (!periodLabels.includes(String(period.period)) && period.name) {
				periodLabels.push(String(period.period));
			}
		});
	});

	return periodLabels.sort((a, b) => Number(a) - Number(b));
};

const parseBarData = (
	absences: Absense[]
): {
	labels: string[];
	datasets: any[];
} => {
	if (!absences) return { labels: [], datasets: [] };
	const labels = parsePeriods(absences);
	const datasets: any[] = [];

	for (const { periods } of absences) {
		for (const period of periods) {
			if (!period.name) continue;

			let dataset = datasets.find(
				(candidate) => candidate.label === period.name
			);
			if (!dataset) {
				dataset = {
					label: period.name,
					borderWidth: 1,
					backgroundColor: getColor(period.name),
					data: labels.map(() => 0),
				};
				datasets.push(dataset);
			}

			const periodIndex = labels.indexOf(String(period.period));
			if (periodIndex !== -1) {
				dataset.data[periodIndex]++;
			}
		}
	}

	return {
		labels,
		datasets,
	};
};

export { parsePeriods, parseBarData, chartOptions };
export type { Attendance, Absense };
