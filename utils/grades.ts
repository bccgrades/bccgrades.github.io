import { Gradebook } from "studentvue";

interface Assignment {
	name: string;
	custom?:boolean;
	grade: {
		letter: string;
		raw: number;
		color: string;
	};
	points: {
		earned: number;
		possible: number;
	};
	date: {
		due: Date;
		assigned: Date;
	};
	category: string;
}


interface gradingScale{
	rounding:{percent:boolean,percentPlaces:number,mark:boolean,markPlaces:number},
	[key:string]:[number,number] | {percent:boolean,percentPlaces:number,mark:boolean,markPlaces:number}
}


interface Course {
	name: string;
	period: number;
	layoutID: number;
	room: string;
	weighted: boolean;
	gradingScale:gradingScale;
	grade: {
		letter: string;
		raw: number;
		color: string;
	};
	reportedRaw?: number;
	gradeEdited?: boolean;
	semesterGrade?: {
		letter: string;
		raw: number;
		color: string;
	};
	teacher: {
		name: string;
		email: string;
	};
	categories: {
		name: string;
		weight: number;
		grade: {
			letter: string;
			raw: number;
			color: string;
		};
		points: {
			earned: number;
			possible: number;
		};
	}[];
	assignments: Assignment[];
}

interface Grades {
	courses: Course[];
	gpa: number;
	wgpa: number;
	semesterCaches?: Grades[];
	period: {
		name: string;
		index: number;
	};
	periods: {
		name: string;
		index: number;
	}[];
}

const defaultGradingScale: gradingScale = {
	rounding: { percent: true, percentPlaces: 2, mark: false, markPlaces: 0 },
	A: [89.5, 100],
	B: [79.5, 89.49],
	C: [69.5, 79.49],
	D: [59.5, 69.49],
	E: [0, 59.49],
};


const letterGradeColor = (letterGrade: string) => {
	try{
	if (letterGrade.includes("A")&&letterGrade!=="N/A") {
		return "green";
	} else if (letterGrade.includes("B")) {
		return "blue";
	} else if (letterGrade.includes("C")) {
		return "yellow";
	} else if (letterGrade.includes("D")) {
		return "orange";
	} else if (letterGrade.includes("E")||letterGrade.includes("F")) {
		return "red";
	} else {
		return "gray";
	}
}catch(error){return "gray"}
};

const letterGrade = (grade: number,gradingScale?:gradingScale): string => {
	const rounding=gradingScale?.rounding;
if(rounding?.percent){
	grade=Number(grade.toFixed(rounding.percentPlaces))

}

	const ranges = gradingScale
	? Object.entries(gradingScale).filter(([name, range]) => {
			if (name === "rounding") return false;
			return (
				Array.isArray(range) &&
				range.length >= 2 &&
				typeof range[0] === "number" &&
				typeof range[1] === "number"
			);
		})
	: [];

if(!gradingScale || ranges.length === 0){
	if (grade >= 89.5) {
	return "A";
	} else if (grade >= 79.5) {
		return "B";
	} else if (grade >= 69.5) {
		return "C";
	} else if (grade >= 59.5) {
		return "D";
	} else if (!isNaN(grade)) {
		return "E";
	} else {
		return "N/A";
	}}
else{
	for(const [letterGrade, range] of ranges){
		if(grade>100){return letterGrade}
		if(grade>=range[0]&&grade<=range[1]){
			
			return letterGrade
		}
	}
	return "N/A"

}
};

const letterGPA = (letterGrade: string, weighted: boolean,double=false): number => {
	let gpa = 0;
	if (weighted) {
		gpa++;
	}
	if(letterGrade.includes("A")&&letterGrade!="N/A"){gpa+=4;}
	else if(letterGrade.includes("B")){gpa+=3;}
	else if(letterGrade.includes("C")){gpa+=2;}
	else if(letterGrade.includes("D")){gpa+=1;}
	else if(letterGrade.includes("E")||letterGrade.includes("F")){gpa+=0;}

	if(double){gpa*=2;}
	return(gpa);
};

const isWeighted = (name: string): boolean => {
	if (name.includes("AP")) return true;
	if (name.includes("Hon")) return true;
	if (name.includes("IB")) return true;
	if (name.includes("Mag")) return true;
	else return false;
};

const isDouble=(name:string):boolean=>{
	if(name.includes("DP")){return true}else{return false}
}

//function to get rid of everything in parentheses in assignment names
const stripParens = (str: string): string => {
	let regex = /\(([^)]+)\)/g;
	return str.replace(regex, "");
};

const parsePoints = (points: string) => {
	const p = points.split("/").map((num) => parseFloat(num.trim()));

	if (p.length === 1) {
		return {
			grade: NaN,
			earned: NaN,
			possible: Number.isFinite(p[0]) ? p[0] : NaN,
		};
	}
	if (p.length === 2) {
		const earned = Number.isFinite(p[0]) ? p[0] : 0;
		const possible = Number.isFinite(p[1]) ? p[1] : 0;
		return {
			grade: possible > 0 ? (earned / possible) * 100 : NaN,
			earned,
			possible,
		};
	}
	throw new Error("Invalid points string");
};

const parseDate = ({ start, end }: { start: Date; end: Date }): string => {
	let startDate = new Date(start);
	let endDate = new Date(end);

	//days left to the due date
	let daysLeft = Math.ceil(
		(endDate.getTime() - new Date().getTime()) / 86400000
	);
	let daysToStart = Math.floor(
		(startDate.getTime() - new Date().getTime()) / 86400000
	);
	let daysAgo = Math.floor(
		(new Date().getTime() - endDate.getTime()) / 86400000
	);

	if (daysLeft > 0 && daysToStart < 0) {
		return `ends in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`;
	} else if (daysToStart > 0) {
		return `starts in ${daysToStart} day${daysToStart > 1 ? "s" : ""}`;
	} else if (daysAgo > 0) {
		return `ended ${daysAgo} day${daysAgo > 1 ? "s" : ""} ago`;
	} else if (daysAgo === 0) {
		return "ends today";
	}
};

const parseAssignmentName = (name: string): string => {
	return new DOMParser().parseFromString(
		new DOMParser().parseFromString(name, "text/html").documentElement
			.textContent,
		"text/html"
	).documentElement.textContent;
};

const normalizeMarkName = (name: string): string =>
	(name || "")
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "");

const selectMark = (marks: any[], periodName: string): any => {
	if (!marks?.length) {
		return {
			name: "none",
			calculatedScore: { raw: NaN, string: "N/A" },
			weightedCategories: [],
			assignments: [],
		};
	}

	const normalizedPeriod = normalizeMarkName(periodName);
	if (!normalizedPeriod) {
		return marks[0];
	}

	const exactMatch = marks.find(
		(mark) => normalizeMarkName(mark.name) === normalizedPeriod
	);
	if (exactMatch) {
		return exactMatch;
	}

	const containingMatch = marks.find((mark) => {
		const normalizedMark = normalizeMarkName(mark.name);
		return (
			normalizedMark &&
			(normalizedMark.includes(normalizedPeriod) ||
				normalizedPeriod.includes(normalizedMark))
		);
	});
	if (containingMatch) {
		return containingMatch;
	}

	if (/semester|sem\s*[12]/i.test(periodName)) {
		const semesterNumber = periodName.match(/[12]/)?.[0];
		const semesterMatch = marks.find((mark) => {
			const name = normalizeMarkName(mark.name);
			return (
				name.includes("semester") ||
				name.includes("sem") ||
				(semesterNumber ? name === `s${semesterNumber}` : false)
			);
		});
		if (semesterMatch) {
			return semesterMatch;
		}
	}

	return marks.find((mark) =>
		Number.isFinite(mark.calculatedScore?.raw)
	) || marks[0];
};

const getMarkingPeriodNumber = (name: string): number | null => {
	const normalized = normalizeMarkName(name);
	if (/mp[1234]/.test(normalized)) {
		const match = normalized.match(/mp([1234])/);
		return match ? Number(match[1]) : null;
	}
	const quarterMatch = normalized.match(/(?:quarter|q|period|progress|interim)([1234])/);
	if (quarterMatch) return Number(quarterMatch[1]);
	const ordinalMatch = normalized.match(/(1st|2nd|3rd|4th|first|second|third|fourth)/);
	if (ordinalMatch) {
		const ordinalMap: Record<string, number> = {
			"1st": 1, first: 1,
			"2nd": 2, second: 2,
			"3rd": 3, third: 3,
			"4th": 4, fourth: 4,
		};
		return ordinalMap[ordinalMatch[1]];
	}
	if (
		normalized.includes("markingperiod1") ||
		normalized === "q1" ||
		normalized === "m1" ||
		normalized.includes("firstmarking") ||
		normalized.includes("1stmarkingperiod")
	) {
		return 1;
	}
	if (
		normalized.includes("markingperiod2") ||
		normalized === "q2" ||
		normalized === "m2" ||
		normalized.includes("secondmarking") ||
		normalized.includes("2ndmarkingperiod")
	) {
		return 2;
	}
	if (
		normalized.includes("markingperiod3") ||
		normalized === "q3" ||
		normalized === "m3" ||
		normalized.includes("thirdmarking") ||
		normalized.includes("3rdmarkingperiod")
	) {
		return 3;
	}
	if (
		normalized.includes("markingperiod4") ||
		normalized === "q4" ||
		normalized === "m4" ||
		normalized.includes("fourthmarking") ||
		normalized.includes("4thmarkingperiod")
	) {
		return 4;
	}
	return null;
};

const isSemesterPeriod = (periodName: string): boolean =>
	/semester|sem\s*[12]|s[12]/i.test(periodName);

const isInterimPeriod = (periodName: string): boolean =>
	/\binterim\b|interim/i.test(periodName);

const getPeriodMarkingPeriodNumber = (periodName: string): number | null => {
	const normalized = normalizeMarkName(periodName);
	const mpMatch = normalized.match(/mp([1234])/);
	if (mpMatch) {
		return Number(mpMatch[1]);
	}
	const quarterMatch = normalized.match(/(?:quarter|q|period|progress|interim)([1234])/);
	if (quarterMatch) return Number(quarterMatch[1]);
	const ordinalMatch = normalized.match(/(1st|2nd|3rd|4th|first|second|third|fourth)/);
	if (ordinalMatch) {
		const ordinalMap: Record<string, number> = {
			"1st": 1, first: 1,
			"2nd": 2, second: 2,
			"3rd": 3, third: 3,
			"4th": 4, fourth: 4,
		};
		return ordinalMap[ordinalMatch[1]];
	}

	const words: Array<[RegExp, number]> = [
		[/markingperiod1|firstmarking|firstinterim|1stmarking|quarter1|q1|^m1/, 1],
		[/markingperiod2|secondmarking|secondinterim|2ndmarking|quarter2|q2|^m2/, 2],
		[/markingperiod3|thirdmarking|thirdinterim|3rdmarking|quarter3|q3|^m3/, 3],
		[/markingperiod4|fourthmarking|fourthinterim|4thmarking|quarter4|q4|^m4/, 4],
	];
	for (const [pattern, number] of words) {
		if (pattern.test(normalized)) {
			return number;
		}
	}
	return null;
};

const getMarkRawForPeriod = (
	marks: any[],
	markingPeriod: number,
	periodName: string
): number => {
	const matchingMarks = marks.filter(
		(mark) => getMarkingPeriodNumber(mark.name) === markingPeriod
	);
	if (!matchingMarks.length) {
		return NaN;
	}

	const interimMarks = matchingMarks.filter((mark) =>
		isInterimPeriod(mark.name)
	);
	if (isInterimPeriod(periodName) && interimMarks.length) {
		const raw = interimMarks[0].calculatedScore?.raw;
		if (Number.isFinite(raw)) {
			return raw;
		}
	}

	const finalMarks = matchingMarks.filter(
		(mark) => !isInterimPeriod(mark.name)
	);
	const selectedMark = finalMarks[0] || matchingMarks[0];
	const raw = selectedMark.calculatedScore?.raw;
	return Number.isFinite(raw) ? raw : NaN;
};

const getSemesterGradeRaw = (
	marks: any[],
	periodName: string
): number => {
	let firstMark: number | null = null;
	let secondMark: number | null = null;
	const periodMark = getPeriodMarkingPeriodNumber(periodName);

	if (periodMark === 2) {
		firstMark = 1;
		secondMark = 2;
	} else if (periodMark === 4) {
		firstMark = 3;
		secondMark = 4;
	} else if (isSemesterPeriod(periodName)) {
		const semesterNumber = periodName.match(/[12]/)?.[0];
		if (semesterNumber === "2") {
			firstMark = 3;
			secondMark = 4;
		} else {
			firstMark = 1;
			secondMark = 2;
		}
	}

	if (firstMark === null || secondMark === null) {
		return NaN;
	}

	const firstRaw = getMarkRawForPeriod(marks, firstMark, periodName);
	const secondRaw = getMarkRawForPeriod(marks, secondMark, periodName);
	if (!Number.isFinite(firstRaw) || !Number.isFinite(secondRaw)) {
		return NaN;
	}

	return Math.round((Math.round(firstRaw) + Math.round(secondRaw)) / 2);
};

const getEffectivePeriodRole = (
	periodName: string,
	periodIndex?: number,
	availablePeriodNames: string[] = []
): number | null => {
	const normalized = normalizeMarkName(periodName);
	if (/semester|sem\s*[12]|s[12]/i.test(normalized)) {
		const semesterNumber = normalized.match(/[12]/)?.[0];
		return semesterNumber === "2" ? 4 : 2;
	}

	const mpMatch = normalized.match(/mp([1234])/);
	if (mpMatch) return Number(mpMatch[1]);

	const markingPeriodMatch = normalized.match(
		/(?:markingperiod|markperiod|gradingperiod|period)([1234])/
	);
	if (markingPeriodMatch) return Number(markingPeriodMatch[1]);

	if (/interim/.test(normalized)) {
		if (/([1234])/.test(normalized)) {
			const interimNumber = normalized.match(/([1234])/)?.[1];
			if (interimNumber === "2" || interimNumber === "4") {
				return Number(interimNumber);
			}
		}
	}

	const quarterMatch = normalized.match(/(?:quarter|q|period|progress|interim|qtr)([1234])/);
	if (quarterMatch) return Number(quarterMatch[1]);

	if (normalized.includes("markingperiod1") || normalized.includes("firstmarking")) return 1;
	if (normalized.includes("markingperiod2") || normalized.includes("secondmarking")) return 2;
	if (normalized.includes("markingperiod3") || normalized.includes("thirdmarking")) return 3;
	if (normalized.includes("markingperiod4") || normalized.includes("fourthmarking")) return 4;

	const ordinalMatch = normalized.match(/(1st|2nd|3rd|4th|first|second|third|fourth)/);
	if (ordinalMatch) {
		const map: Record<string, number> = {
			"1st": 1, first: 1,
			"2nd": 2, second: 2,
			"3rd": 3, third: 3,
			"4th": 4, fourth: 4,
		};
		return map[ordinalMatch[1]];
	}

	if (periodIndex !== undefined && availablePeriodNames.length) {
		const position = availablePeriodNames.findIndex(
			(name) => {
				const availableNormalized = normalizeMarkName(name);
				return (
					availableNormalized === normalized ||
					availableNormalized.includes(normalized) ||
					normalized.includes(availableNormalized)
				);
			}
		);
		if (position === 0) return 1;
		if (position === 1) return 2;
		if (position === 2) return 3;
		if (position === 3) return 4;
	}

	return null;
};

const mergeSemesterGrades = (
	selectedGrades: Grades,
	periodCaches: Grades[]
): Grades => {
	const merged = structuredClone(selectedGrades);
	const availableNames = merged.periods.map(({ name }) => name);
	const caches = structuredClone(periodCaches);
	const selectedCacheIndex = caches.findIndex(
		(cache) => cache.period.index === merged.period.index
	);
	if (selectedCacheIndex >= 0) {
		caches[selectedCacheIndex] = structuredClone(merged);
	} else {
		caches.push(structuredClone(merged));
	}
	merged.semesterCaches = structuredClone(caches);

	merged.courses = merged.courses.map((course, courseIndex) => {
		const role = getEffectivePeriodRole(
			merged.period.name,
			merged.period.index,
			availableNames
		);
		if (role === null || role === 1 || role === 3) {
			delete course.semesterGrade;
			return course;
		}

		const firstRole = role === 2 ? 1 : 3;
		const firstRaw = caches
			.map((cache) => {
				const cacheRole = getEffectivePeriodRole(
					cache.period.name,
					cache.period.index,
					cache.periods.map(({ name }) => name)
				);
				const partner = cache.courses[courseIndex];
				return cacheRole === firstRole
					? (partner?.gradeEdited
						? partner.grade.raw
						: partner?.reportedRaw ?? partner?.grade.raw)
					: NaN;
			})
			.find((raw) => Number.isFinite(raw));

		let secondRaw = course.gradeEdited
			? course.grade.raw
			: course.reportedRaw ?? course.grade.raw;
		if (!Number.isFinite(secondRaw)) {
			secondRaw = caches
				.map((cache) => {
					const cacheRole = getEffectivePeriodRole(
						cache.period.name,
						cache.period.index,
						cache.periods.map(({ name }) => name)
					);
					const partner = cache.courses[courseIndex];
					return cacheRole === role
						? (partner?.gradeEdited
							? partner.grade.raw
							: partner?.reportedRaw ?? partner?.grade.raw)
						: NaN;
				})
				.find((raw) => Number.isFinite(raw));
		}

		if (!Number.isFinite(firstRaw) || !Number.isFinite(secondRaw)) {
			delete course.semesterGrade;
			return course;
		}

		const mp1Raw = Math.round(firstRaw);
		const mp2Raw = Math.round(secondRaw);
		const raw = Math.round((mp1Raw + mp2Raw) / 2);
		course.semesterGrade = {
			letter: course.gradingScale
				? letterGrade(raw, course.gradingScale)
				: String(raw),
			raw,
			color: letterGradeColor(letterGrade(raw, course.gradingScale)),
		};
		return course;
	});

	return merged;
};

const recomputeSemesterGrades = (grades: Grades): Grades => {
	const caches = grades.semesterCaches?.length
		? structuredClone(grades.semesterCaches)
		: [structuredClone(grades)];
	return mergeSemesterGrades(grades, caches);
};

const preserveSemesterCaches = (
	currentGrades: Grades | undefined,
	freshCaches: Grades[]
): Grades[] => {
	const preserved = structuredClone(freshCaches);
	for (const existing of currentGrades?.semesterCaches || []) {
		const index = preserved.findIndex(
			(cache) => cache.period.index === existing.period.index
		);
		if (index >= 0) preserved[index] = structuredClone(existing);
	}
	return preserved;
};

const getReportedCourseGrade = (
	marks: any[],
	periodName: string
): number => {
	const selectedMark = selectMark(marks, periodName);
	const raw = selectedMark.calculatedScore?.raw;
	return Number.isFinite(raw) ? raw : NaN;
};

const parseGrades = (grades: Gradebook): Grades => {
	const gradingScale=grades.gradingScale ?? defaultGradingScale;
	const periodName = grades.reportingPeriod?.current?.name || "";
	for (let i = 0; i < grades.courses.length; i++) {
		if (grades.courses[i].marks.length === 0) {
			grades.courses[i].marks = [
				{
					calculatedScore: { raw: NaN, string: "N/A" },
					weightedCategories: [],
					assignments: [],
					name: "",
				},
			];
		}
	}
	const validParsedCourses = grades.courses.filter((course) =>
		Number.isFinite(getReportedCourseGrade(course.marks, periodName))
	);
	let parsedGrades:Grades = {
		gpa: validParsedCourses.length
			? validParsedCourses.reduce(
					(total, course) =>
						total +
						letterGPA(
							letterGrade(
								getReportedCourseGrade(course.marks, periodName),
								gradingScale
							),
							false,
							isDouble(course.title)
						),
					0
				) / validParsedCourses.length
			: 0,
		wgpa: validParsedCourses.length
			? validParsedCourses.reduce(
					(total, course) =>
						total +
						letterGPA(
							letterGrade(
								getReportedCourseGrade(course.marks, periodName),
								gradingScale
							),
							isWeighted(course.title),
							isDouble(course.title)
						),
					0
				) / validParsedCourses.length
			: 0,
		courses: grades.courses.map(({ title, period, room, staff, marks }, i) => {
			const selectedMark = selectMark(marks, periodName);
			const reportedRaw = getReportedCourseGrade(marks, periodName);
			return ({
			name: stripParens(title),
			period: period ? period : i + 1,
			layoutID:null,
			room: room,
			weighted: isWeighted(title),
			gradingScale:gradingScale,
			grade: {
				letter: gradingScale ? (Number.isFinite(reportedRaw) ? letterGrade(reportedRaw,gradingScale) : "N/A") : (Number.isFinite(reportedRaw) ? String(reportedRaw) : "N/A"),
				raw: reportedRaw,
				color: Number.isFinite(reportedRaw) ? letterGradeColor(letterGrade(reportedRaw,gradingScale)) : letterGradeColor("N/A"),
			},
			reportedRaw,
			teacher: {
				name: staff.name,
				email: staff.email,
			},
			categories: selectedMark.weightedCategories.length
  ? selectedMark.weightedCategories
      .map(({ type, weight, points }) => ({
        name: type,
        weight: parseFloat(weight.standard) / 100,
        grade: {
          letter: gradingScale ? letterGrade((points.current / points.possible) * 100,gradingScale) : String((points.current/points.possible)*100),
          raw: parseFloat(
            ((points.current / points.possible) * 100).toFixed(2)
          ),
          color: letterGradeColor(
            letterGrade((points.current / points.possible) * 100,gradingScale)
          ),
        },
        points: {
          earned: points.current,
          possible: points.possible,
        },
      }))
      .filter((category) => !category.name.toLowerCase().includes("total"))
  : selectedMark.assignments.length ? [
      {
        name: "Default5421",
        weight: 1, // assuming 100% weight
        grade: {
          letter: (()=>{let pointsEarned=0;selectedMark.assignments.forEach(({name,date,points,type})=>{if(!isNaN(parsePoints(points).earned)){pointsEarned+=parsePoints(points).earned}});let pointsP=0;selectedMark.assignments.forEach(({name,date,points,type})=>{if(!isNaN(parsePoints(points).earned)){pointsP+=parsePoints(points).possible}});return(gradingScale ? letterGrade((pointsEarned/pointsP)*100,gradingScale):String((pointsEarned/pointsP)*100))})(), // or whatever default value you'd like
          raw: (()=>{let pointsEarned=0;selectedMark.assignments.forEach(({name,date,points,type})=>{if(!isNaN(parsePoints(points).earned)){pointsEarned+=parsePoints(points).earned}});let pointsP=0;selectedMark.assignments.forEach(({name,date,points,type})=>{if(!isNaN(parsePoints(points).earned)){pointsP+=parsePoints(points).possible}});return(parseFloat(((pointsEarned/pointsP)*100).toFixed(2)))})(),
          color: (()=>{let pointsEarned=0;selectedMark.assignments.forEach(({name,date,points,type})=>{if(!isNaN(parsePoints(points).earned)){pointsEarned+=parsePoints(points).earned}});let pointsP=0;selectedMark.assignments.forEach(({name,date,points,type})=>{if(!isNaN(parsePoints(points).earned)){pointsP+=parsePoints(points).possible}});return(letterGradeColor(letterGrade((pointsEarned/pointsP)*100,gradingScale)))})()
        },
        points: {
          earned: (()=>{let pointsE=0;selectedMark.assignments.forEach(({name,date,points,type})=>{if(!isNaN(parsePoints(points).earned)){pointsE+=parsePoints(points).earned}});return(pointsE)})(),
          possible: (()=>{let pointsP=0;selectedMark.assignments.forEach(({name,date,points,type})=>{if(!isNaN(parsePoints(points).earned)){pointsP+=parsePoints(points).possible}});return(pointsP)})(),
        },
      },
    ] : [],

			assignments: selectedMark.assignments.map(({ name, date, points, type }) => ({
				name: parseAssignmentName(name),
				grade: {
					letter: gradingScale ? letterGrade(parsePoints(points).grade,gradingScale) : String(parsePoints(points).grade),
					raw: parseFloat(parsePoints(points).grade.toFixed(2)),
					color: letterGradeColor(letterGrade(parsePoints(points).grade,gradingScale)),
				},
				points: {
					earned: parsePoints(points).earned,
					possible: parsePoints(points).possible,
				},
				date: {
					due: date.start,
					assigned: date.due,
				},
				category: selectedMark.weightedCategories.length ? type : "Default5421",
			})),
		}); }),
		period: {
			name: grades.reportingPeriod.current.name,
			index: grades.reportingPeriod.current.index,
		},
		periods: grades.reportingPeriod.available.map(({ name, index, date }) => ({
			name: `${name} (${parseDate(date)})`,
			index: index,
		})),
	};

	parsedGrades.courses.forEach((course:Course) => {
		if (course.categories[0] && course.categories[0].name !== "Default5421") {
			course.categories.forEach((category, i) => {
				course = calculateCategory(course, i);
			});
			if (!isSemesterPeriod(periodName)) {
				calculateGrade(course);
			}
		}
	});
	parsedGrades.courses.forEach((course:Course,index) => {
		course.layoutID=index;
	});

	return parsedGrades;
};

const genTable = (
	course: Course,
	desired: number,
	remaining: Array<number>
): [number[], number][] => {
	if (!Number.isFinite(desired) || desired < 0 || desired > 100) {
		return [];
	}

	const categories = course.categories;
	const normalizedWeight =
		categories.reduce(
			(total, category) =>
				total +
				(Number.isFinite(category.weight) && category.weight > 0
					? category.weight
					: 0),
			0
		);
	if (normalizedWeight <= 0) {
		return [];
	}

	const remainingPoints = categories.map((_, index) => {
		const value = remaining[index];
		return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
	});
	const earned = categories.map((category) =>
		Number.isFinite(category.points.earned)
			? Math.max(0, category.points.earned)
			: 0
	);
	const possible = categories.map((category) =>
		Number.isFinite(category.points.possible)
			? Math.max(0, category.points.possible)
			: 0
	);
	const weights = categories.map((category) =>
		Number.isFinite(category.weight) && category.weight > 0
			? category.weight / normalizedWeight
			: 0
	);
	const scores = new Array(categories.length).fill(0);
	const solutions: [number[], number][] = [];
	const maxSolutions = 100;

	const calculateGrade = (scoreValues: number[]) => {
		let grade = 0;
		for (let i = 0; i < categories.length; i++) {
			const denominator = possible[i] + remainingPoints[i];
			if (denominator > 0 && weights[i] > 0) {
				grade +=
					((earned[i] + scoreValues[i]) / denominator) *
					100 *
					weights[i];
			}
		}
		return grade;
	};

	const recurse = (categoryIndex: number) => {
		if (solutions.length >= maxSolutions) {
			return;
		}
		if (categoryIndex === categories.length) {
			const grade = calculateGrade(scores);
			if (grade >= desired - 0.000001) {
				solutions.push([[...scores], grade]);
			}
			return;
		}

		for (
			let score = 0;
			score <= remainingPoints[categoryIndex];
			score++
		) {
			scores[categoryIndex] = score;
			recurse(categoryIndex + 1);
			if (solutions.length >= maxSolutions) {
				return;
			}
		}
	};

	recurse(0);
	solutions.sort((a, b) => {
		const aTotal = a[0].reduce((total, score) => total + score, 0);
		const bTotal = b[0].reduce((total, score) => total + score, 0);
		return aTotal - bTotal;
	});

	return solutions;
};

const calculateCategory = (course: Course, categoryId: number): Course => {
	const gradingScale=course.gradingScale;
	course.categories[categoryId].points.earned = course.assignments
		.filter(
			(assignment) =>
				assignment.category === course.categories[categoryId].name &&
				Number.isFinite(assignment.points.possible) &&
				assignment.points.possible > 0 &&
				Number.isFinite(assignment.points.earned)
		)
		.reduce((a, b) => a + b.points.earned, 0);
	course.categories[categoryId].points.possible = course.assignments
		.filter(
			(assignment) =>
				assignment.category === course.categories[categoryId].name &&
				Number.isFinite(assignment.points.possible) &&
				assignment.points.possible > 0 &&
				Number.isFinite(assignment.points.earned)
		)
		.reduce((a, b) => a + b.points.possible, 0);
	const possible = course.categories[categoryId].points.possible;
	const raw =
		possible > 0
			? (course.categories[categoryId].points.earned / possible) * 100
			: NaN;
	course.categories[categoryId].grade.raw = Number.isFinite(raw)
		? parseFloat(raw.toFixed(2))
		: NaN;
	course.categories[categoryId].grade.letter = letterGrade(
		course.categories[categoryId].grade.raw,gradingScale
	);
	course.categories[categoryId].grade.color = letterGradeColor(
		course.categories[categoryId].grade.letter
	);
	return course;
};

const calculateGrade = (course: Course): Course => {
	const gradingScale=course.gradingScale;
	let currWeight = 0;
	let trueCategories = course.categories.filter((c) => {
		if (Number.isFinite(c.grade.raw) && c.weight > 0) {
			currWeight += c.weight;
			return true;
		}
		return false;
	});
	course.grade.raw = parseFloat(
		trueCategories
			.reduce((a, b) => {
				return a + b.grade.raw * (b.weight / currWeight);
			}, 0)
			.toFixed(2)
	);

	if (trueCategories.length === 0) {
		course.grade.raw = NaN;
	}
	course.grade.letter = letterGrade(course.grade.raw,gradingScale);
	course.grade.color = letterGradeColor(course.grade.letter);
	return course;
};

const addAssignment = (course: Course): Course => {
	course.assignments.unshift({
		name: "New Assignment",
		custom:true,
		grade: {
			letter: "N/A",
			raw: NaN,
			color: "gray",
		},
		points: {
			earned: 0,
			possible: 0,
		},
		date: {
			due: new Date(),
			assigned: new Date(),
		},
		category: course.categories.length ? course.categories[0].name : "N/A",
	});
	course.categories.forEach((category, i) => {
		course = calculateCategory(course, i);
	});
	course = calculateGrade(course);
	course.gradeEdited = true;
	return course;
};

const calculateGPA = (grades: Grades): Grades => {
	const validCourses = grades.courses.filter((course) =>
		Number.isFinite(course.grade.raw)
	);
	grades.gpa = validCourses.length
		? validCourses.reduce(
				(total, course) =>
					total +
					letterGPA(
						letterGrade(course.grade.raw, course.gradingScale),
						false,
						isDouble(course.name)
					),
				0
			) / validCourses.length
		: 0;
	grades.wgpa = validCourses.length
		? validCourses.reduce(
				(total, course) =>
					total +
					letterGPA(
						letterGrade(course.grade.raw, course.gradingScale),
						course.weighted,
						isDouble(course.name)
					),
				0
			) / validCourses.length
		: 0;

	return { ...grades };
};

const updateGPA = (grades: Grades, i: number, val: boolean): Grades => {
	grades.courses[i].weighted = val;
	grades = calculateGPA(grades);

	return { ...grades };
};

const delAssignment = (course: Course, assignmentId: number): Course => {
	course.assignments.splice(assignmentId, 1);
	course.categories.forEach((category, i) => {
		course = calculateCategory(course, i);
	});
	course = calculateGrade(course);
	course.gradeEdited = true;
	return course;
};

const updateCategory = (
	course: Course,
	assignmentId: number,
	val: string
): Course => {
	course.assignments[assignmentId].category = course.categories[val].name;
	course.categories.forEach((category, i) => {
		course = calculateCategory(course, i);
	});
	course = calculateGrade(course);
	course.gradeEdited = true;
	return course;
};

const updateCourse = (
	course: Course,
	assignmentId: number,
	update: string,
	val: number
): Course => {
	if (update === "earned") {
		if (val < 0) val = 0;
		course.assignments[assignmentId].points.earned = val;
	} else if (update === "possible") {
		if (val < 0) val = 0;
		course.assignments[assignmentId].points.possible = val;
	}
	let categoryId = course.categories.findIndex(
		(category) => category.name === course.assignments[assignmentId].category
	);

	//update assignment grade
	const assignmentPossible =
		course.assignments[assignmentId].points.possible;
	const assignmentRaw =
		assignmentPossible > 0
			? (course.assignments[assignmentId].points.earned /
					assignmentPossible) *
				100
			: NaN;
	course.assignments[assignmentId].grade.raw = Number.isFinite(assignmentRaw)
		? parseFloat(assignmentRaw.toFixed(2))
		: NaN;
	course.assignments[assignmentId].grade.letter = letterGrade(
		course.assignments[assignmentId].grade.raw,course.gradingScale
	);
	course.assignments[assignmentId].grade.color = letterGradeColor(
		course.assignments[assignmentId].grade.letter
	);

	//update category grade
	course = calculateCategory(course, categoryId);

	//update whole course grade
	course = calculateGrade(course);
	course.gradeEdited = true;
	return course;
};

function abbreviate(category) {
    category = category.toUpperCase();
    var separator;

    if (category.includes(" ")) {
        separator = " ";
    } else if (category.includes("/")) {
        separator = "/";
    } else {
        // Remove vowels only if they are not the first character in the string
        ["A", "E", "I", "O", "U"].forEach((vowel) => {
            category = category.replaceAll(
                new RegExp(`(?<!^)${vowel}`, 'g'),
                ""
            );
        });
        return category;
    }
    const words = category.split(separator).filter((word) => word !== "/" && word !== " ");
    return (words[0].trim()[0] + words[1].trim()[0]);
}

export {
	parseGrades,
	updateCourse,
	addAssignment,
	delAssignment,
	updateCategory,
	genTable,
	calculateGPA,
	updateGPA,
	abbreviate,
	mergeSemesterGrades,
	recomputeSemesterGrades,
	preserveSemesterCaches
};
export type { Grades, Assignment, Course };
