import React, { useState, useEffect } from "react";
import "../styles/globals.css";
import { Client } from "studentvue";
import { useRouter } from "next/router";
import { Flowbite, Toast, useTheme } from "flowbite-react";
import Topbar from "../components/TopBar";
import SideBar from "../components/SideBar";
import MobileBar from "../components/MobileBar";
import { Grades, parseGrades, mergeSemesterGrades } from "../utils/grades";
import Head from "next/head";
import { HiX } from "react-icons/hi";
import { AnimateSharedLayout } from "framer-motion";
import Cookies from "js-cookie";
import useWindowSize from '../hooks/useWindowSize';
import allDistricts from "../lib/districts";
import Script from "next/script";
import {
	unwrapStudentVueResponse,
} from "../utils/studentvue";

const STUDENT_VUE_PROXY = "https://student-vue.bccgrades.workers.dev";

interface Toast {
	title: string;
	type: "success" | "error" | "warning" | "info";
}


const noShowNav = ["/login", "/", "/privacy", "/letter","/faq"];

function MyApp({ Component, pageProps }) {
	const router = useRouter();
	const [districtURL, setDistrictURL] = useState(
		undefined
	);
	const [client, setClient] = useState(undefined);
	const [studentInfo, setStudentInfo] = useState(undefined);
	const [toasts, setToasts] = useState<Toast[]>([]);
	const [grades, setGrades] = useState<Grades>();
	const [period, setPeriod] = useState<number>();
	const [currentPeriod, setCurrentPeriod] = useState<number>();
	const [loading, setLoading] = useState(false);
	const [rootAuthChecked, setRootAuthChecked] = useState(false);
	const [districts, setDistricts] = useState(allDistricts);
	const { width } = useWindowSize();
	const isMediumOrLarger = width >= 768;

	useEffect(() => {
		if (process.env.NODE_ENV !== "development" || !("serviceWorker" in navigator)) {
			return;
		}

		navigator.serviceWorker.getRegistrations().then(async (registrations) => {
			if (registrations.length === 0) {
				return;
			}

			await Promise.all(registrations.map((registration) => registration.unregister()));
			if (
				navigator.serviceWorker.controller &&
				sessionStorage.getItem("sw-development-reloaded") !== "true"
			) {
				sessionStorage.setItem("sw-development-reloaded", "true");
				window.location.reload();
			}
		});
	}, []);

	const login = async (
		username: string,
		password: string,
		save: boolean,
		url?: string,
		encrypted?: boolean
	) => {
		setLoading(true);
		const district = url || districtURL;
		const districtEndpoint = district.endsWith("/")
			? `${district}Service/PXPCommunication.asmx`
			: `${district}/Service/PXPCommunication.asmx`;
		const fetchedClient = new Client({
			username: username,
			password: password,
			districtUrl: districtEndpoint,
			encrypted: encrypted || false,
		}, STUDENT_VUE_PROXY);
			let passwordSave = Promise.resolve();
			if (save) {
				localStorage.setItem("remember", "true");
				Cookies.set("username", username, { expires: 7, secure: false, sameSite: "Lax" });
				if (!encrypted) {
					passwordSave = fetch(`${STUDENT_VUE_PROXY}/encryptPassword`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ password }),
					}).then(async (response) => {
						const result = await response.json();
						Cookies.set("password", result.encryptedPassword, { expires: 7 });
					});
				}
			} else {
				localStorage.setItem("remember", "false");
				Cookies.remove("username");
				Cookies.remove("password");
				Cookies.remove("districtURL");
			}
			districts.forEach(district=>{
				if(district.parentVueUrl==districtURL){Cookies.set("districtURL",JSON.stringify(district),{expires:7})}
			});
			passwordSave.catch((err) => {
				console.log(err);
				createError(err.message);
			});

			try {
				const freshGradebook = await fetchedClient.gradebook(undefined, undefined, true);
				setClient(fetchedClient);
				const rawGradebook = unwrapStudentVueResponse(freshGradebook);
				const parsedGrades = parseGrades(rawGradebook);
				const periodCaches = await Promise.all(
					parsedGrades.periods.map(async ({ index }) =>
						parseGrades(
							unwrapStudentVueResponse(
								await fetchedClient.gradebook(index, undefined, false)
							)
						)
					)
				);
				setGrades(
					mergeSemesterGrades(parsedGrades, periodCaches)
				);
				setCurrentPeriod(parsedGrades.period.index);
				setPeriod(parsedGrades.period.index);
				if (router.pathname === "/" || router.pathname === "/login") {
					await router.push("/grades");
				}
				setLoading(false);
				return true;
			} catch (err) {
				console.log(err);
				const message =
					err instanceof Error
						? err.message
						: typeof err === "object" && err !== null && "message" in err
							? String((err as { message: unknown }).message)
							: String(err);
				createError(message);
				setLoading(false);
				if (router.pathname === "/") {
					setRootAuthChecked(true);
					await router.replace("/login");
				}
				return false;
			}
	};

	useEffect(()=>{
		if(client!==undefined&&studentInfo==undefined){
			client.studentInfo().then(info=>{
				info = unwrapStudentVueResponse(info);
				setStudentInfo(info)
			}).catch(error=>{client.ChildList().then(info=>{
				info = unwrapStudentVueResponse(info);
				setStudentInfo(info);

			}).catch()
		
		})
		}
	},[client])

	useEffect(() => {
		var refURL: string="";
		async function doLogin(){
			await login(Cookies.get("username"),Cookies.get("password"),true,districtURL,true)}
		if(Cookies.get("districtURL")!=undefined&&districtURL==undefined){
			console.log("RELEASE ME")
			let cookieDistrict=JSON.parse(Cookies.get("districtURL"));
			console.log(cookieDistrict);
			if(districts.findIndex(district=>district.parentVueUrl==cookieDistrict.parentVueUrl)==-1){let temp=districts;temp.push(cookieDistrict);setDistricts(temp)}
			setDistrictURL(cookieDistrict.parentVueUrl);
			console.log(districtURL)
			refURL=cookieDistrict.parentVueUrl;

		}else{if(districtURL==undefined){setDistrictURL("https://md-mcps-psv.edupoint.com")}}
		if(client===undefined&&Cookies.get("username")!=undefined&&Cookies.get("password")!=undefined&&districtURL!==undefined){
			doLogin();
			
		}else{if(client===undefined&&(!noShowNav.includes(router.pathname)||router.pathname=="/")&&!refURL){console.log("SHIT FUCK");router.push("/login")}}
	}, [client,districtURL]);

	useEffect(() => {
		if (!router.isReady || router.pathname !== "/" || client !== undefined) {
			return;
		}
		const hasSavedCredentials =
			Cookies.get("username") !== undefined &&
			Cookies.get("password") !== undefined &&
			Cookies.get("districtURL") !== undefined;

		if (!hasSavedCredentials && !loading) {
			router.replace("/login");
			setRootAuthChecked(true);
		}
	}, [client, loading, router.isReady, router.pathname]);

	function createError(message:string){
		console.log("Verbose Error: ",message)
		const rtErrorMatch = message.match(/ERROR_MESSAGE=["']([^"']+)["']/);
		if (rtErrorMatch?.[1]) {
			message = rtErrorMatch[1];
		}
		const preSets={"upgraded":"API Token Expired, come back soon?","incorrect":"Username or Password is Incorrect","invalid":"Username or Password is Incorrect","load failed":"Network Error","failed to fetch":"Network Error:Try Again Later","socket":"Network Error"};
		for(let key in preSets){
			if(message.toLowerCase().includes(key)){var message=preSets[key];break}
		}

		setToasts((toasts) => [...toasts, { title: message, type: "error" }]);
		setTimeout(() => {
			setToasts((toasts) => toasts.slice(1));
		}, 5000);
	}

const logout = async () => {
	await Cookies.remove("password");
	await router.push("/login");
	 setClient(undefined);
	 setGrades(undefined);
	setCurrentPeriod(undefined);
	
	
	setStudentInfo(undefined);
	
	if(localStorage.getItem("remember")=="false"){Cookies.remove("username")}
	Cookies.remove("districtURL");

};

	if (router.pathname === "/" && (client === undefined || !rootAuthChecked)) {
		return null;
	}

	// useEffect(() => {
	// 	let username = localStorage.getItem("username");
	// 	let password = localStorage.getItem("password");
	// 	let remember = localStorage.getItem("remember");
	// 	let storedDistrictURL = localStorage.getItem("districtURL");
	// 	storedDistrictURL && setDistrictURL(storedDistrictURL);
	// 	if (remember === "true" && username && password && storedDistrictURL) {
	// 		login(username, password, true, districtURL);
	// 	}
	// }, []);

	return (
		<Flowbite>
			<Head>
				<title>Grade Melon</title>
			</Head>
			<div className="fixed p-5 z-[60]">
				{toasts.map(({ title, type }, i) => (
					<div className="mb-5 z-50" key={i}>
						<Toast>
							<div
								onClick={() =>
									setToasts((prev) => {
										prev.splice(i, 1);
										return prev;
									})
								}
								className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200"
							>
								<HiX className="h-5 w-5" />
							</div>
							<div className="ml-3 text-sm font-normal">{title}</div>
							<Toast.Toggle />
						</Toast>
					</div>
				))}
			</div>
		
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
				<Topbar studentInfo={studentInfo} logout={logout} client={client} />
				<div>
					{!client && (
						<AnimateSharedLayout>
							<Component
								{...pageProps}
								districtURL={districtURL}
								setDistrictURL={setDistrictURL}
								login={login}
								client={client}
								grades={grades}
								setGrades={setGrades}
								setToasts={setToasts}
								loading={loading}
								period={period}
								setPeriod={setPeriod}
								currentPeriod={currentPeriod}
								createError={createError}
								districts={districts}
								setDistricts={setDistricts}
								isMediumOrLarger={isMediumOrLarger}
							/>
						</AnimateSharedLayout>
					)}

					{client && isMediumOrLarger && (
						<div className="pb-16 md:pb-0">
							<div className="flex overflow-x-auto">
								<SideBar studentInfo={studentInfo} logout={logout} />
								<AnimateSharedLayout>
									<Component
										{...pageProps}
										districtURL={districtURL}
										setDistrictURL={setDistrictURL}
										client={client}
										login={login}
										grades={grades}
										setGrades={setGrades}
										setToasts={setToasts}
										loading={loading}
										period={period}
										setPeriod={setPeriod}
										currentPeriod={currentPeriod}
										createError={createError}
										districts={districts}
										setDistricts={setDistricts}
										isMediumOrLarger={isMediumOrLarger}
									/>
								</AnimateSharedLayout>
							</div>
						</div>
					)}
					{client && !isMediumOrLarger && (
						<div className="pb-16 md:pb-0">
							<div className="md:hidden">
								<AnimateSharedLayout>
									<Component
										{...pageProps}
										districtURL={districtURL}
										client={client}
										login={login}
										setClient={setClient}
										grades={grades}
										setGrades={setGrades}
										setToasts={setToasts}
										loading={loading}
										period={period}
										setPeriod={setPeriod}
										currentPeriod={currentPeriod}
										createError={createError}
										districts={districts}
										setDistricts={setDistricts}
										isMediumOrLarger={isMediumOrLarger}
									/>
								</AnimateSharedLayout>
								<div className="px-4 fixed bottom-5 w-full">
									<MobileBar />
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
			
		</Flowbite>
	);
}

export default MyApp;
