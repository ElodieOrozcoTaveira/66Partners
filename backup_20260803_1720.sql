--
-- PostgreSQL database dump
--

\restrict 8E7MfRrFNhbVNNplitOEfK4XvqgbOWfXnfKJygG5HN5EEmUEyHBXsBAinl44Sje

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: partners66
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO partners66;

--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: partners66
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO partners66;

--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: partners66
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO partners66;

--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: partners66
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- Name: activities_status; Type: TYPE; Schema: public; Owner: partners66
--

CREATE TYPE public.activities_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'COMPLETED'
);


ALTER TYPE public.activities_status OWNER TO partners66;

--
-- Name: participation_status; Type: TYPE; Schema: public; Owner: partners66
--

CREATE TYPE public.participation_status AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REFUSED'
);


ALTER TYPE public.participation_status OWNER TO partners66;

--
-- Name: sport_level; Type: TYPE; Schema: public; Owner: partners66
--

CREATE TYPE public.sport_level AS ENUM (
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED',
    'EXPERT'
);


ALTER TYPE public.sport_level OWNER TO partners66;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: partners66
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint,
    name text,
    applied_at timestamp with time zone DEFAULT now()
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO partners66;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: partners66
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO partners66;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: partners66
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: activities; Type: TABLE; Schema: public; Owner: partners66
--

CREATE TABLE public.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(150) NOT NULL,
    description text,
    city character varying(100) NOT NULL,
    start_date timestamp without time zone NOT NULL,
    latitude double precision,
    longitude double precision,
    level_required public.sport_level NOT NULL,
    max_participants integer NOT NULL,
    status public.activities_status DEFAULT 'PENDING'::public.activities_status NOT NULL,
    sport_id uuid NOT NULL,
    creator_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.activities OWNER TO partners66;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: partners66
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    activity_id uuid NOT NULL
);


ALTER TABLE public.conversations OWNER TO partners66;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: partners66
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contenu text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    users_id uuid NOT NULL,
    conversations_id uuid NOT NULL
);


ALTER TABLE public.messages OWNER TO partners66;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: partners66
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(100) NOT NULL,
    contenu text,
    est_lu boolean,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    users_id uuid NOT NULL
);


ALTER TABLE public.notifications OWNER TO partners66;

--
-- Name: opinion; Type: TABLE; Schema: public; Owner: partners66
--

CREATE TABLE public.opinion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    notes smallint,
    commentaire text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    users_id uuid NOT NULL
);


ALTER TABLE public.opinion OWNER TO partners66;

--
-- Name: participations; Type: TABLE; Schema: public; Owner: partners66
--

CREATE TABLE public.participations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    activity_id uuid NOT NULL,
    status public.participation_status DEFAULT 'PENDING'::public.participation_status NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.participations OWNER TO partners66;

--
-- Name: sport_favorites; Type: TABLE; Schema: public; Owner: partners66
--

CREATE TABLE public.sport_favorites (
    user_id uuid NOT NULL,
    sport_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sport_favorites OWNER TO partners66;

--
-- Name: sports; Type: TABLE; Schema: public; Owner: partners66
--

CREATE TABLE public.sports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sports OWNER TO partners66;

--
-- Name: user_sports; Type: TABLE; Schema: public; Owner: partners66
--

CREATE TABLE public.user_sports (
    user_id uuid NOT NULL,
    sport_id uuid NOT NULL,
    level public.sport_level NOT NULL
);


ALTER TABLE public.user_sports OWNER TO partners66;

--
-- Name: users; Type: TABLE; Schema: public; Owner: partners66
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    pseudo character varying(100) NOT NULL,
    city character varying(100),
    bio text,
    avatar character varying(255),
    latitude double precision,
    longitude double precision,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO partners66;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: partners66
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: partners66
--

COPY drizzle.__drizzle_migrations (id, hash, created_at, name, applied_at) FROM stdin;
1	92cd1253fa321840f5e07d0bad49baa560705a94910cdbba188c376b5876c179	1785765030000	20260803135030_adorable_thor_girl	2026-08-03 14:10:50.8188+00
\.


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: partners66
--

COPY public.activities (id, title, description, city, start_date, latitude, longitude, level_required, max_participants, status, sport_id, creator_id, created_at, updated_at) FROM stdin;
fa53322e-2ae9-4c2f-867e-cd4e7a8dbd69	Squash - Sortie découverte	Tabella nulla demergo inventore colo curvo vis. Spargo sursum minus reprehenderit expedita velociter sumo. Bos tempus optio cruciamentum distinctio facere aperio coruscus nemo atqui.	Canet-en-Roussillon	2026-09-09 16:49:02.141	42.698989999999995	3.035	ADVANCED	3	CONFIRMED	cdf729e4-f701-4ad3-b41c-dbea2c0ab866	18ae8913-6649-44b0-b35e-813108e27435	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
c98aa456-ab81-4d0f-9b82-d012990b0f45	VTT - Match amical	Depromo artificiose trado conitor cribro nam arma aer. Viduo aeternus correptius benigne vallum aequitas arcesso valeo balbus iusto. Thymum delectatio currus vos earum appello templum claustrum.	Rivesaltes	2026-07-25 16:30:07.428	42.77139	2.87041	BEGINNER	15	PENDING	33c3111c-d352-420f-a75c-6c4c7db20977	a30a564e-c8ff-43a8-8f52-24186bf7f821	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
2c6e131c-b5cc-486b-b74c-a666fe6d1e4b	Golf - Session entraînement	Abundans eius arbitro. Doloremque trado vigilo doloribus fuga. Clamo volup conor vitium earum sustineo teres tyrannus vallum adopto.	Canet-en-Roussillon	2026-08-28 00:23:08.384	42.70668	3.02054	EXPERT	16	COMPLETED	ac317b4b-3112-4083-a0bd-0d413259c117	0f9517a0-f24a-4bad-a24d-cbc917058379	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
09b1046b-0d39-4d62-ad39-5a4a16c189e6	Gravel - Session entraînement	Verto tum vehemens surculus causa nesciunt delectus adopto. Ocer tertius caelestis soluta. Tracto pecus uberrime considero thema a vaco sustineo.	Céret	2026-08-12 04:29:28.251	42.4847	2.74462	BEGINNER	14	COMPLETED	e2260db3-5829-4806-a8f8-e9c0765ce67e	cbe1ff36-f445-4436-a3f6-c78507a72c7b	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
1283076a-2c3e-413e-a096-502fbba81503	Cyclisme - Sortie découverte	Adeo tempora viridis auxilium assentator ullam. Pariatur utrum certus caput demulceo. Tero cribro texo degenero rem quae convoco decumbo suadeo.	Font-Romeu	2026-09-09 14:48:43.963	42.50635	2.0420100000000003	EXPERT	4	CONFIRMED	08e8e0d6-24c2-46ea-aec4-2ca39c02a4d4	c9e33655-22eb-4a48-a795-40a1ee602d33	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
33537c46-00e4-40f4-803a-9ca9d3180b16	Cyclisme - Sortie découverte	Amplitudo bibo acceptus nostrum. Vulticulus dolorem cruentus uberrime repudiandae fugiat cubitum. Id error atrocitas desparatus cometes aptus deorsum.	Font-Romeu	2026-07-25 11:30:16.248	42.50024	2.03077	BEGINNER	20	PENDING	08e8e0d6-24c2-46ea-aec4-2ca39c02a4d4	236288e1-5573-4088-85a7-6551a194bba2	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
ea905d1b-7ffe-4639-8e63-c408ffbc62b8	Boxe - Session entraînement	Adinventitias surculus tergum cedo ratione deserunt degenero amissio. Utpote concido arbitro. Nulla theologus adhuc vicissitudo quo.	Saint-Cyprien	2026-08-26 00:09:51.373	42.61813	3.01928	EXPERT	4	CANCELLED	660fa770-511c-4a18-bc29-92bf50a5aae3	4113b428-5187-4144-b45f-e98633de2dc4	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
50e34c62-1b10-46b2-9439-c51ba4ffdd44	Golf - Initiation	Volubilis illum terror balbus repellat placeat. Cervus assumenda demens campana aequus admoneo. Tam calco quibusdam decretum.	Rivesaltes	2026-08-29 06:02:42.425	42.76918	2.87405	BEGINNER	6	CANCELLED	ac317b4b-3112-4083-a0bd-0d413259c117	9568ae0b-dcf1-4cd3-aa5e-dca401368e4a	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
95aa206b-486d-4a62-bbfc-f048f6968448	Boxe - Sortie découverte	Caste suus modi curto velut vigor artificiose capto acerbitas. Basium appositus rem toties armarium video arbitro. Adeptio adimpleo tantillus caute casus sol.	Thuir	2026-08-30 19:15:07.233	42.63666	2.75106	ADVANCED	6	PENDING	660fa770-511c-4a18-bc29-92bf50a5aae3	abf87f86-7c20-41e1-9bf5-ab434ce57af5	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
c57408cc-2887-4388-b977-ae515f6a54bd	Cyclisme - Sortie découverte	Valens cui cupiditas. Totidem vivo comitatus debilito. Voluptatibus cicuta auxilium usus viriliter volup synagoga aegrus vomica cado.	Prades	2026-09-05 23:57:30.983	42.62393	2.41474	EXPERT	4	CANCELLED	08e8e0d6-24c2-46ea-aec4-2ca39c02a4d4	8050d146-f796-428e-bdf2-3cb5362b49b5	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
4fe1a432-c89a-4301-9c61-7e71dd90e815	Volleyball - Sortie découverte	Ultio corroboro porro sophismata natus crustulum tutamen accusamus patrocinor vomica. Comedo maiores caelum a carmen. Umbra veritatis sollicito alii.	Perpignan	2026-08-28 14:30:47.947	42.70275	2.89221	BEGINNER	5	CANCELLED	0831cad8-9f10-499e-b5e5-4f49d29258d0	18ae8913-6649-44b0-b35e-813108e27435	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
b2b5584c-ae33-4fde-a735-4668a04adeb8	Football - Initiation	Voluptatem deporto surgo adsuesco crux adfectus vacuus. Suppellex cuppedia decens demitto decumbo corpus spes quisquam ancilla. Denego amo ventito solus tutis tenus.	Prades	2026-09-08 01:37:41.376	42.610400000000006	2.4313200000000004	EXPERT	14	CANCELLED	c4b8e105-3025-4818-86bb-a0443a43f078	512d85e1-3ce9-424f-a433-d564e0d36662	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
1b70ed6a-b39d-4cb3-a7cc-85d54f6c7122	Musculation - Match amical	Color adsum maxime saepe cogo corpus harum. Textilis casus tibi. Copia advenio approbo.	Prades	2026-09-17 10:30:17.861	42.60841	2.42268	ADVANCED	13	PENDING	10f3c477-7ab0-4578-9af2-5e121031b8d3	52251cb8-05f8-4415-af56-7f98e6f3955c	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
209f1f7f-98de-4674-95e3-e8731511e07f	Football - Session entraînement	Canis reiciendis damnatio. Vestrum quibusdam triduana ambitus administratio desolo. Casus auxilium clarus repudiandae adeo coaegresco auctus decor curvo.	Font-Romeu	2026-09-04 15:07:14.099	42.49614	2.03171	EXPERT	16	PENDING	c4b8e105-3025-4818-86bb-a0443a43f078	8050d146-f796-428e-bdf2-3cb5362b49b5	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
53a80a6c-e1ed-4815-995c-8a5d5e6fddc8	Badminton - Session entraînement	Theca deinde apostolus depromo vulnero utroque subseco. Admoveo conitor debitis capitulus adduco villa accusantium. Vapulus voluptate blandior vereor utor caterva reprehenderit.	Céret	2026-08-29 09:44:48.634	42.49292	2.75873	BEGINNER	3	CONFIRMED	d327471d-91c0-49ac-a2a7-94f7d96280bc	52251cb8-05f8-4415-af56-7f98e6f3955c	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
33dd8c47-f3bc-4a2c-9312-71f6930f79ac	Pétanque - Session entraînement	Subseco averto cupressus abscido natus tenax. Sophismata incidunt dapifer damnatio conqueror velut sit socius ater. Degusto calcar corrigo odio annus atrocitas teres claro conqueror consuasor.	Céret	2026-08-16 10:30:38.04	42.492799999999995	2.7447399999999997	BEGINNER	4	CANCELLED	5ce20f87-da2b-4120-bca0-b2dde68c0fc3	b51ba8fa-7091-4aaa-adf3-d6b395ed7009	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
8fa194cc-b2ef-46a1-848b-3d9aeb52175a	Gravel - Initiation	Admiratio vulgo uxor confero crustulum solutio decet coniecto administratio ullam. Aggero fuga bardus contabesco casus considero. Decens vapulus basium.	Font-Romeu	2026-07-28 14:45:55.606	42.508669999999995	2.04853	BEGINNER	6	CANCELLED	e2260db3-5829-4806-a8f8-e9c0765ce67e	4113b428-5187-4144-b45f-e98633de2dc4	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
c833bb52-28b2-40f4-a3ee-31a0b91bd88f	Natation - Initiation	Vita sto toties. Suasoria spectaculum peior concedo thesis peccatus accusamus adulatio animi antea. Quaerat deserunt atrox.	Céret	2026-09-11 11:23:37.199	42.480819999999994	2.74544	BEGINNER	4	CONFIRMED	76234a93-2a66-4e03-8595-11a64a610a78	cbe1ff36-f445-4436-a3f6-c78507a72c7b	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
cfec5708-0bd7-4212-a369-0304dc4e41da	Yoga - Session entraînement	Capio demulceo ustulo curiositas minima vehemens officia. Turpis theologus cubo curto aperte solutio arto deduco agnosco. Talis commodi capto vetus universe inflammatio.	Canet-en-Roussillon	2026-08-03 11:17:51.789	42.69307	3.03066	INTERMEDIATE	14	CONFIRMED	9c11c011-c91c-49e7-a1b9-e710dba98b49	84ff5b92-6cd8-40cd-b1b2-ad260df4cc13	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
3468e16c-7fd1-40b3-890a-fd38a5b79815	Padel - Sortie groupe	Tunc id excepturi appono utilis solutio. Adulatio carmen sordeo virtus verus abbas usus thalassinus ait. Cultellus abundans aiunt suffoco cauda patria appello ait alter spargo.	Perpignan	2026-08-31 15:58:26.804	42.69775	2.8943	EXPERT	4	COMPLETED	8ecc2f99-b372-4563-809f-71aad66dae1c	abf87f86-7c20-41e1-9bf5-ab434ce57af5	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
8f9f8f22-136a-4889-bc48-65464139cef5	Basketball - Sortie découverte	Accusator solum usus placeat bonus cubitum vereor cattus possimus necessitatibus. Arx adsidue tamen suspendo. Sol curvo tricesimus caecus voveo valde.	Prades	2026-08-31 23:29:45.527	42.61988	2.41744	ADVANCED	7	PENDING	2e80dfe2-5490-425f-825c-1552a113e2f6	03570ffb-87bd-4184-8b05-0af84c510c7b	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
3872b3c7-91be-4f31-9ad2-d7ddde536b55	Boxe - Match amical	Videlicet suffoco explicabo dens tollo adficio. Substantia cupressus terror dignissimos. Aeternus tamisium sed tum comptus.	Saint-Cyprien	2026-09-12 09:19:02.589	42.62181	3.0336100000000004	INTERMEDIATE	6	COMPLETED	660fa770-511c-4a18-bc29-92bf50a5aae3	18ae8913-6649-44b0-b35e-813108e27435	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
63349c00-6767-4dc9-8fb6-53b6400bf829	Yoga - Sortie groupe	Conspergo tamquam perferendis. Statim degenero vis una. Correptius statua atrox infit decet appono.	Prades	2026-09-06 15:22:48.772	42.615520000000004	2.4223700000000004	EXPERT	3	COMPLETED	9c11c011-c91c-49e7-a1b9-e710dba98b49	236288e1-5573-4088-85a7-6551a194bba2	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
d4c2cef6-05d8-4b02-bdf4-6a9fec7a8659	Musculation - Sortie groupe	Caveo defetiscor turba decretum. Aliqua voro inventore. Voluptate attonbitus vulnero viduo benigne tres aurum caritas contego aperio.	Perpignan	2026-08-29 10:07:06.97	42.70607	2.89505	BEGINNER	17	COMPLETED	10f3c477-7ab0-4578-9af2-5e121031b8d3	18ae8913-6649-44b0-b35e-813108e27435	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
76442c78-6915-4069-95c5-ed2fc997d05a	VTT - Sortie découverte	Adimpleo aro synagoga amaritudo ater. Delicate solus statua amaritudo celer. Stips alveus vis color facilis tantillus defendo vespillo concido vos.	Rivesaltes	2026-09-11 03:40:02.635	42.77155	2.86086	EXPERT	6	COMPLETED	33c3111c-d352-420f-a75c-6c4c7db20977	52251cb8-05f8-4415-af56-7f98e6f3955c	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
e206465d-72ac-4bd1-bbca-2303bf735da1	Basketball - Sortie découverte	Dolore appositus aliqua conscendo territo amissio. Acsi addo usque asper dignissimos vomito volo. Aegre molestias cunabula quos sublime.	Font-Romeu	2026-08-10 06:32:55.267	42.49944	2.0475700000000003	ADVANCED	20	PENDING	2e80dfe2-5490-425f-825c-1552a113e2f6	cbe1ff36-f445-4436-a3f6-c78507a72c7b	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
2912c1c1-28a7-4467-bcad-7138b4696d15	Golf - Initiation	Dens validus magnam ascit carpo. Adduco ullus earum cum adulatio. Tracto alo sufficio cupio carcer error tener textor.	Argelès-sur-Mer	2026-09-14 02:45:18.204	42.55063	3.01999	INTERMEDIATE	8	COMPLETED	ac317b4b-3112-4083-a0bd-0d413259c117	52251cb8-05f8-4415-af56-7f98e6f3955c	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
d5b70962-e056-4823-bccf-b0220e4f1d20	VTT - Sortie découverte	Sordeo cattus sit basium tondeo stipes alioqui acsi asperiores. Nemo defleo delectus delectus curia thalassinus curo. Auctus eius venio.	Elne	2026-08-04 05:25:00.67	42.60863	2.9804600000000003	BEGINNER	14	CANCELLED	33c3111c-d352-420f-a75c-6c4c7db20977	236288e1-5573-4088-85a7-6551a194bba2	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
7577cf85-96ff-4281-820b-813df6a27ca9	Running - Initiation	Considero soluta excepturi cognatus vulgus debitis villa aliquid umquam. Utique vicissitudo omnis cattus. Ventito acies peior campana clementia.	Rivesaltes	2026-07-31 20:05:51.404	42.762119999999996	2.85931	ADVANCED	17	PENDING	c2edbcc5-69ec-4108-945e-cb1126358dc4	9da9f201-7a76-43d3-973f-be5dab086dbb	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
b0f45c09-aa6d-4654-9f52-edd55edce41a	Boxe - Sortie découverte	Demum viscus cuppedia spiritus. Acerbitas vaco conservo pauci vere sint velut. Depereo ex trans.	Canet-en-Roussillon	2026-08-30 18:37:14.351	42.698809999999995	3.02332	BEGINNER	14	CONFIRMED	660fa770-511c-4a18-bc29-92bf50a5aae3	b51ba8fa-7091-4aaa-adf3-d6b395ed7009	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
225b14ec-36e6-4d7b-ad53-e912ac2940ff	Badminton - Initiation	Adamo sub volubilis sunt suspendo timor aedificium coruscus. Tempore audacia dens. Attollo temporibus curo termes repudiandae taedium derideo absconditus adipisci amet.	Thuir	2026-09-11 23:14:36.925	42.63628	2.76533	BEGINNER	7	CONFIRMED	d327471d-91c0-49ac-a2a7-94f7d96280bc	03570ffb-87bd-4184-8b05-0af84c510c7b	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
68567465-5dc2-4ad7-86f6-a84ee6de25de	Football - Sortie groupe	Nostrum deludo capillus corrumpo attero asperiores vestigium sint deduco veritas. Benigne audio sol derideo somnus baiulus correptius atavus necessitatibus terror. Odio demonstro tyrannus curtus clarus certe cupio curvo.	Argelès-sur-Mer	2026-09-02 12:44:22.725	42.55504	3.02679	INTERMEDIATE	14	PENDING	c4b8e105-3025-4818-86bb-a0443a43f078	bb44c842-791d-46cc-b0e1-7b3e805c0232	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
4517f71b-9c08-45b7-ba71-0c469fdb91a9	Randonnée - Match amical	Conventus suus curto voluptas ancilla voluptatum. Derelinquo tibi thesaurus textus admiratio cimentarius ceno. Alii coaegresco vito adflicto subnecto.	Argelès-sur-Mer	2026-09-09 21:05:18.664	42.542739999999995	3.0343	EXPERT	4	PENDING	7eeabf2f-2900-4bd9-b77a-7bbc56f17b29	debfcb70-81bf-45ff-9e70-7ef3ea90bb7d	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
d989b5ff-af35-41a3-9967-da67b4195312	Tennis - Session entraînement	Et temptatio timor cicuta sulum creator subiungo. Atrocitas clibanus concido debitis sono ad benevolentia. Tristis alter valde.	Rivesaltes	2026-08-15 11:21:37.05	42.77288	2.86057	BEGINNER	12	CONFIRMED	55deca20-6216-4fab-a743-a9784e37e6f7	18ae8913-6649-44b0-b35e-813108e27435	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
7c69762c-777c-4066-9da9-dae7f7b806e1	Boxe - Initiation	Quis una commemoro audentia apto trans considero depopulo. Avaritia adhaero umquam deripio combibo et corporis. Abeo quod commodi est termes cunctatio terminatio ars.	Perpignan	2026-08-11 00:24:48.688	42.70252	2.89758	EXPERT	12	PENDING	660fa770-511c-4a18-bc29-92bf50a5aae3	0f9517a0-f24a-4bad-a24d-cbc917058379	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
32fc9154-08e3-4fec-8b2b-60ea9c265ec8	Gravel - Sortie découverte	Alo synagoga tergum coaegresco tibi claudeo sulum similique. Deputo adopto adamo aestas. Et peior custodia caries.	Rivesaltes	2026-07-29 16:39:45.05	42.760979999999996	2.87824	INTERMEDIATE	5	CANCELLED	e2260db3-5829-4806-a8f8-e9c0765ce67e	9da9f201-7a76-43d3-973f-be5dab086dbb	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
840fcad8-47f5-495b-8eac-6208d372a7c9	Tennis - Initiation	Bellum vicinus delectus. Perspiciatis degero caecus conitor ut deorsum ipsum acsi testimonium crux. Acies ventosus caecus.	Canet-en-Roussillon	2026-09-01 09:13:16.573	42.69412	3.02493	ADVANCED	20	CANCELLED	55deca20-6216-4fab-a743-a9784e37e6f7	b51ba8fa-7091-4aaa-adf3-d6b395ed7009	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
d6cfeab1-e163-4158-8bb4-3db2d5d5be7b	VTT - Session entraînement	Deserunt subnecto vinitor caelum. Stabilis animi cultura comptus sub bardus arceo venio utroque. Umbra aqua subiungo cui ancilla tempora.	Canet-en-Roussillon	2026-09-03 19:18:05.848	42.69754	3.03155	ADVANCED	8	CANCELLED	33c3111c-d352-420f-a75c-6c4c7db20977	ddf59040-eb7d-496d-8313-192b9f58e66e	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
9780191c-5ead-436d-a4a1-8f71890d451f	Squash - Initiation	Conculco clarus thermae aliquid. Tamisium consuasor caveo auctus terebro quisquam altus conqueror voluptas. Suscipit cubitum una.	Prades	2026-08-25 17:08:50.247	42.627050000000004	2.41845	BEGINNER	14	CANCELLED	cdf729e4-f701-4ad3-b41c-dbea2c0ab866	52251cb8-05f8-4415-af56-7f98e6f3955c	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
02580f66-14fb-40e4-a3ee-431d186a8ce3	Padel - Match amical	Caute nihil sto curiositas aliquam crapula placeat utpote arbustum tutis. Spiritus texo pauci attero patrocinor cohibeo cado. Cognatus sub subito vomer candidus.	Argelès-sur-Mer	2026-08-21 08:12:17.136	42.544579999999996	3.02505	BEGINNER	6	CANCELLED	8ecc2f99-b372-4563-809f-71aad66dae1c	bb44c842-791d-46cc-b0e1-7b3e805c0232	2026-07-24 13:53:53.912297	2026-07-24 13:53:53.912297
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: partners66
--

COPY public.conversations (id, created_at, activity_id) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: partners66
--

COPY public.messages (id, contenu, created_at, users_id, conversations_id) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: partners66
--

COPY public.notifications (id, type, contenu, est_lu, created_at, users_id) FROM stdin;
\.


--
-- Data for Name: opinion; Type: TABLE DATA; Schema: public; Owner: partners66
--

COPY public.opinion (id, notes, commentaire, created_at, users_id) FROM stdin;
\.


--
-- Data for Name: participations; Type: TABLE DATA; Schema: public; Owner: partners66
--

COPY public.participations (id, user_id, activity_id, status, created_at) FROM stdin;
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: partners66
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: sport_favorites; Type: TABLE DATA; Schema: public; Owner: partners66
--

COPY public.sport_favorites (user_id, sport_id, created_at) FROM stdin;
\.


--
-- Data for Name: sports; Type: TABLE DATA; Schema: public; Owner: partners66
--

COPY public.sports (id, name, created_at) FROM stdin;
c4b8e105-3025-4818-86bb-a0443a43f078	Football	2026-07-24 13:53:53.868512
2e80dfe2-5490-425f-825c-1552a113e2f6	Basketball	2026-07-24 13:53:53.868512
55deca20-6216-4fab-a743-a9784e37e6f7	Tennis	2026-07-24 13:53:53.868512
c2edbcc5-69ec-4108-945e-cb1126358dc4	Running	2026-07-24 13:53:53.868512
08e8e0d6-24c2-46ea-aec4-2ca39c02a4d4	Cyclisme	2026-07-24 13:53:53.868512
76234a93-2a66-4e03-8595-11a64a610a78	Natation	2026-07-24 13:53:53.868512
10f3c477-7ab0-4578-9af2-5e121031b8d3	Musculation	2026-07-24 13:53:53.868512
9c11c011-c91c-49e7-a1b9-e710dba98b49	Yoga	2026-07-24 13:53:53.868512
c88aa618-1f3b-4528-8f22-340d5477f794	Escalade	2026-07-24 13:53:53.868512
d327471d-91c0-49ac-a2a7-94f7d96280bc	Badminton	2026-07-24 13:53:53.868512
0831cad8-9f10-499e-b5e5-4f49d29258d0	Volleyball	2026-07-24 13:53:53.868512
7eeabf2f-2900-4bd9-b77a-7bbc56f17b29	Randonnée	2026-07-24 13:53:53.868512
660fa770-511c-4a18-bc29-92bf50a5aae3	Boxe	2026-07-24 13:53:53.868512
8ecc2f99-b372-4563-809f-71aad66dae1c	Padel	2026-07-24 13:53:53.868512
ac317b4b-3112-4083-a0bd-0d413259c117	Golf	2026-07-24 13:53:53.868512
5ce20f87-da2b-4120-bca0-b2dde68c0fc3	Pétanque	2026-07-24 13:53:53.868512
e2260db3-5829-4806-a8f8-e9c0765ce67e	Gravel	2026-07-24 13:53:53.868512
33c3111c-d352-420f-a75c-6c4c7db20977	VTT	2026-07-24 13:53:53.868512
cdf729e4-f701-4ad3-b41c-dbea2c0ab866	Squash	2026-07-24 13:53:53.868512
16e7aa29-ec96-4094-af9b-5a8622d94ddb	Pickleball	2026-07-24 14:42:58.313293
f1fb0890-3ba1-48ae-8a30-bdcba2b8bd97	Paddle	2026-07-24 14:42:58.313293
b15d2c8e-f9b6-4e33-8dd8-edb4542f7da9	Marche	2026-07-24 14:42:58.313293
\.


--
-- Data for Name: user_sports; Type: TABLE DATA; Schema: public; Owner: partners66
--

COPY public.user_sports (user_id, sport_id, level) FROM stdin;
c9e33655-22eb-4a48-a795-40a1ee602d33	08e8e0d6-24c2-46ea-aec4-2ca39c02a4d4	EXPERT
c9e33655-22eb-4a48-a795-40a1ee602d33	0831cad8-9f10-499e-b5e5-4f49d29258d0	EXPERT
c9e33655-22eb-4a48-a795-40a1ee602d33	cdf729e4-f701-4ad3-b41c-dbea2c0ab866	EXPERT
512d85e1-3ce9-424f-a433-d564e0d36662	5ce20f87-da2b-4120-bca0-b2dde68c0fc3	INTERMEDIATE
512d85e1-3ce9-424f-a433-d564e0d36662	10f3c477-7ab0-4578-9af2-5e121031b8d3	BEGINNER
512d85e1-3ce9-424f-a433-d564e0d36662	33c3111c-d352-420f-a75c-6c4c7db20977	BEGINNER
9568ae0b-dcf1-4cd3-aa5e-dca401368e4a	e2260db3-5829-4806-a8f8-e9c0765ce67e	INTERMEDIATE
9568ae0b-dcf1-4cd3-aa5e-dca401368e4a	660fa770-511c-4a18-bc29-92bf50a5aae3	ADVANCED
9568ae0b-dcf1-4cd3-aa5e-dca401368e4a	0831cad8-9f10-499e-b5e5-4f49d29258d0	BEGINNER
0f9517a0-f24a-4bad-a24d-cbc917058379	10f3c477-7ab0-4578-9af2-5e121031b8d3	EXPERT
eec8b59f-1f74-49fe-817f-768984342c6b	55deca20-6216-4fab-a743-a9784e37e6f7	INTERMEDIATE
8050d146-f796-428e-bdf2-3cb5362b49b5	d327471d-91c0-49ac-a2a7-94f7d96280bc	BEGINNER
8050d146-f796-428e-bdf2-3cb5362b49b5	c4b8e105-3025-4818-86bb-a0443a43f078	ADVANCED
8050d146-f796-428e-bdf2-3cb5362b49b5	76234a93-2a66-4e03-8595-11a64a610a78	BEGINNER
52251cb8-05f8-4415-af56-7f98e6f3955c	7eeabf2f-2900-4bd9-b77a-7bbc56f17b29	INTERMEDIATE
52251cb8-05f8-4415-af56-7f98e6f3955c	e2260db3-5829-4806-a8f8-e9c0765ce67e	EXPERT
52251cb8-05f8-4415-af56-7f98e6f3955c	10f3c477-7ab0-4578-9af2-5e121031b8d3	INTERMEDIATE
236288e1-5573-4088-85a7-6551a194bba2	33c3111c-d352-420f-a75c-6c4c7db20977	BEGINNER
236288e1-5573-4088-85a7-6551a194bba2	ac317b4b-3112-4083-a0bd-0d413259c117	INTERMEDIATE
ddf59040-eb7d-496d-8313-192b9f58e66e	10f3c477-7ab0-4578-9af2-5e121031b8d3	EXPERT
ddf59040-eb7d-496d-8313-192b9f58e66e	33c3111c-d352-420f-a75c-6c4c7db20977	BEGINNER
84ff5b92-6cd8-40cd-b1b2-ad260df4cc13	d327471d-91c0-49ac-a2a7-94f7d96280bc	INTERMEDIATE
84ff5b92-6cd8-40cd-b1b2-ad260df4cc13	08e8e0d6-24c2-46ea-aec4-2ca39c02a4d4	ADVANCED
b51ba8fa-7091-4aaa-adf3-d6b395ed7009	08e8e0d6-24c2-46ea-aec4-2ca39c02a4d4	ADVANCED
e73c20bc-f843-40e1-a418-6fd344bbd328	e2260db3-5829-4806-a8f8-e9c0765ce67e	BEGINNER
e73c20bc-f843-40e1-a418-6fd344bbd328	8ecc2f99-b372-4563-809f-71aad66dae1c	BEGINNER
d2b04937-bb65-4fa6-8aa0-c38b215370e9	7eeabf2f-2900-4bd9-b77a-7bbc56f17b29	BEGINNER
d2b04937-bb65-4fa6-8aa0-c38b215370e9	c88aa618-1f3b-4528-8f22-340d5477f794	EXPERT
d2b04937-bb65-4fa6-8aa0-c38b215370e9	76234a93-2a66-4e03-8595-11a64a610a78	EXPERT
5e20abcc-c2f1-4d93-9740-8cc600e5cfef	cdf729e4-f701-4ad3-b41c-dbea2c0ab866	INTERMEDIATE
5e20abcc-c2f1-4d93-9740-8cc600e5cfef	8ecc2f99-b372-4563-809f-71aad66dae1c	BEGINNER
debfcb70-81bf-45ff-9e70-7ef3ea90bb7d	d327471d-91c0-49ac-a2a7-94f7d96280bc	EXPERT
4113b428-5187-4144-b45f-e98633de2dc4	33c3111c-d352-420f-a75c-6c4c7db20977	EXPERT
a30a564e-c8ff-43a8-8f52-24186bf7f821	9c11c011-c91c-49e7-a1b9-e710dba98b49	INTERMEDIATE
a30a564e-c8ff-43a8-8f52-24186bf7f821	c88aa618-1f3b-4528-8f22-340d5477f794	INTERMEDIATE
a30a564e-c8ff-43a8-8f52-24186bf7f821	e2260db3-5829-4806-a8f8-e9c0765ce67e	BEGINNER
03570ffb-87bd-4184-8b05-0af84c510c7b	ac317b4b-3112-4083-a0bd-0d413259c117	ADVANCED
03570ffb-87bd-4184-8b05-0af84c510c7b	e2260db3-5829-4806-a8f8-e9c0765ce67e	BEGINNER
03570ffb-87bd-4184-8b05-0af84c510c7b	2e80dfe2-5490-425f-825c-1552a113e2f6	EXPERT
abf87f86-7c20-41e1-9bf5-ab434ce57af5	660fa770-511c-4a18-bc29-92bf50a5aae3	BEGINNER
abf87f86-7c20-41e1-9bf5-ab434ce57af5	9c11c011-c91c-49e7-a1b9-e710dba98b49	ADVANCED
0ae4c3ea-beeb-4243-82a4-319e329e9253	2e80dfe2-5490-425f-825c-1552a113e2f6	INTERMEDIATE
0ae4c3ea-beeb-4243-82a4-319e329e9253	76234a93-2a66-4e03-8595-11a64a610a78	BEGINNER
06f92e37-4b51-42d5-ad0a-989f30b4bd8d	2e80dfe2-5490-425f-825c-1552a113e2f6	BEGINNER
06f92e37-4b51-42d5-ad0a-989f30b4bd8d	33c3111c-d352-420f-a75c-6c4c7db20977	INTERMEDIATE
06f92e37-4b51-42d5-ad0a-989f30b4bd8d	5ce20f87-da2b-4120-bca0-b2dde68c0fc3	INTERMEDIATE
18ae8913-6649-44b0-b35e-813108e27435	5ce20f87-da2b-4120-bca0-b2dde68c0fc3	INTERMEDIATE
18ae8913-6649-44b0-b35e-813108e27435	08e8e0d6-24c2-46ea-aec4-2ca39c02a4d4	EXPERT
c7981f69-0eab-44b4-ae23-c29c8f9e5cb2	cdf729e4-f701-4ad3-b41c-dbea2c0ab866	BEGINNER
c7981f69-0eab-44b4-ae23-c29c8f9e5cb2	76234a93-2a66-4e03-8595-11a64a610a78	EXPERT
c7981f69-0eab-44b4-ae23-c29c8f9e5cb2	10f3c477-7ab0-4578-9af2-5e121031b8d3	EXPERT
225a5dbe-8fdc-40fc-9a22-f4cbf5c2f853	0831cad8-9f10-499e-b5e5-4f49d29258d0	INTERMEDIATE
225a5dbe-8fdc-40fc-9a22-f4cbf5c2f853	660fa770-511c-4a18-bc29-92bf50a5aae3	ADVANCED
225a5dbe-8fdc-40fc-9a22-f4cbf5c2f853	33c3111c-d352-420f-a75c-6c4c7db20977	EXPERT
3d310143-6049-4e69-b7b0-6b27e7a3c34b	e2260db3-5829-4806-a8f8-e9c0765ce67e	EXPERT
bb44c842-791d-46cc-b0e1-7b3e805c0232	2e80dfe2-5490-425f-825c-1552a113e2f6	INTERMEDIATE
49ace313-2827-436a-90f2-090f5f571e52	5ce20f87-da2b-4120-bca0-b2dde68c0fc3	INTERMEDIATE
49ace313-2827-436a-90f2-090f5f571e52	2e80dfe2-5490-425f-825c-1552a113e2f6	BEGINNER
9da9f201-7a76-43d3-973f-be5dab086dbb	10f3c477-7ab0-4578-9af2-5e121031b8d3	BEGINNER
e1b9bd1b-9a4d-4038-917d-28f896b5f152	c88aa618-1f3b-4528-8f22-340d5477f794	BEGINNER
cbe1ff36-f445-4436-a3f6-c78507a72c7b	5ce20f87-da2b-4120-bca0-b2dde68c0fc3	BEGINNER
cbe1ff36-f445-4436-a3f6-c78507a72c7b	2e80dfe2-5490-425f-825c-1552a113e2f6	EXPERT
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: partners66
--

COPY public.users (id, email, password, pseudo, city, bio, avatar, latitude, longitude, created_at, updated_at) FROM stdin;
c9e33655-22eb-4a48-a795-40a1ee602d33	clinton_wiza32@gmail.com	Im3z7aiByyanyk5xa90Q	Evie_Kuhlman39	Font-Romeu	Adeptio consuasor voluptatum.	https://avatars.githubusercontent.com/u/55047997	42.50871	2.0466200000000003	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
512d85e1-3ce9-424f-a433-d564e0d36662	diane_deckow20@gmail.com	ZptyPHmeFWiKvOeWHY76	Rex_Wiza21	Canet-en-Roussillon	Subiungo tepidus surgo agnitio.	https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/91.jpg	42.700869999999995	3.02582	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
9568ae0b-dcf1-4cd3-aa5e-dca401368e4a	shawn_mertz@yahoo.com	HF0Mlc0X227Htbxzaicf	Doreen.Skiles63	Céret	Vitium verbum ago.	https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/79.jpg	42.489079999999994	2.7510499999999998	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
0f9517a0-f24a-4bad-a24d-cbc917058379	justin.hegmann@gmail.com	EfH9rpriu5eqdxXoVqOa	Rowena_Gottlieb29	Rivesaltes	Votum ad vorax tenetur ventus contra attollo umbra ascit.	https://avatars.githubusercontent.com/u/41694741	42.759209999999996	2.86973	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
eec8b59f-1f74-49fe-817f-768984342c6b	eulalia_beer-mayer63@yahoo.com	Fk1CynE36ReJelFCBHyw	Conrad_Nolan	Céret	Civis arcesso beatus.	https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/512/69.jpg	42.49015	2.7559099999999996	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
8050d146-f796-428e-bdf2-3cb5362b49b5	josiah59@gmail.com	Suq_HsPQabiFdFx5sqDt	Jessy_Barrows	Font-Romeu	Molestias advenio velut crustulum nostrum agnosco corrupti rerum.	https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/79.jpg	42.49456	2.03053	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
52251cb8-05f8-4415-af56-7f98e6f3955c	beulah2@hotmail.com	AK80dM5UH3FywK8o2N7q	Johanna88	Thuir	Vorax atque spargo sequi baiulus.	https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/512/90.jpg	42.63507	2.75387	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
236288e1-5573-4088-85a7-6551a194bba2	greta.muller@gmail.com	hDn2DapO7GDGrKRmo3TM	Chyna.Weissnat	Canet-en-Roussillon	Deporto vaco alveus canonicus eius repudiandae theologus ulterius aut depopulo.	https://avatars.githubusercontent.com/u/72729037	42.69923	3.02632	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
ddf59040-eb7d-496d-8313-192b9f58e66e	julius_schultz32@hotmail.com	evSva2Xj7zdj_63vCXTa	Ernesto75	Canet-en-Roussillon	Vacuus somniculosus velum quisquam validus aetas.	https://avatars.githubusercontent.com/u/59408051	42.689299999999996	3.03221	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
84ff5b92-6cd8-40cd-b1b2-ad260df4cc13	faye_rodriguez@yahoo.com	4zamyxsFgCmgu63MInmj	Taylor67	Prades	Animadverto voluptatem labore.	https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/13.jpg	42.61885	2.42299	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
b51ba8fa-7091-4aaa-adf3-d6b395ed7009	karine78@hotmail.com	kUWj0xvDTac0N9QC0Nog	Daniel_Nitzsche14	Thuir	Sint trans caelestis uredo ustulo aliqua aperte quis quos.	https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/94.jpg	42.63463	2.75757	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
e73c20bc-f843-40e1-a418-6fd344bbd328	louise.lemke@gmail.com	2KD3Lhj3SsqpcwJMeOsI	Leif63	Thuir	Caute deinde studio caput cognatus asperiores arcus vigilo.	https://avatars.githubusercontent.com/u/54232572	42.6257	2.7528699999999997	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
d2b04937-bb65-4fa6-8aa0-c38b215370e9	saige_kovacek@yahoo.com	r0kWMqoomATrSq7S9sFJ	Adelia54	Rivesaltes	Tollo conitor strenuus ventus.	https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/46.jpg	42.76484	2.86806	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
5e20abcc-c2f1-4d93-9740-8cc600e5cfef	dean0@yahoo.com	hVai5Qn3Q_GgPUWmEql0	Alene.Kuhlman96	Perpignan	Vetus curso vulgus callide saepe uxor stabilis surculus thermae umbra.	https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/69.jpg	42.69196	2.89849	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
debfcb70-81bf-45ff-9e70-7ef3ea90bb7d	gayle28@yahoo.com	sfpsAn90jMMv9mAlKySU	Claire56	Elne	Thermae deserunt eos delibero demoror aut cena sed non.	https://avatars.githubusercontent.com/u/40114710	42.595980000000004	2.96862	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
4113b428-5187-4144-b45f-e98633de2dc4	delaney9@gmail.com	B5Xha9pSpdwB7hZooPsB	Lydia40	Thuir	Cupio cursus quis cenaculum aequitas ambulo.	https://avatars.githubusercontent.com/u/57127873	42.62735	2.75149	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
a30a564e-c8ff-43a8-8f52-24186bf7f821	estell18@hotmail.com	pjfDYctl75FgY33Tp6zy	Martina7	Saint-Cyprien	Causa caute vesper desidero cogo alii.	https://avatars.githubusercontent.com/u/67147464	42.61478	3.0313000000000003	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
03570ffb-87bd-4184-8b05-0af84c510c7b	eunice.carroll@yahoo.com	dk__PTHHu3dllkDBTZ2b	Marjorie.Wuckert	Saint-Cyprien	Sopor corroboro alias adfero desipio adversus iure.	https://avatars.githubusercontent.com/u/41733654	42.62581	3.0287100000000002	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
abf87f86-7c20-41e1-9bf5-ab434ce57af5	heaven_osinski@yahoo.com	hOQD7iDQijw4VW_x7LrL	Wayne_Schinner	Rivesaltes	Textilis vindico degero quidem sophismata aspernatur statua curatio cupio sapiente.	https://avatars.githubusercontent.com/u/47647606	42.76014	2.86866	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
0ae4c3ea-beeb-4243-82a4-319e329e9253	alexandra_franecki@gmail.com	byuCqh5W5Ib0Qa7uSoRn	Mindy_Lesch99	Argelès-sur-Mer	Advoco cruciamentum desidero.	https://avatars.githubusercontent.com/u/7614545	42.55099	3.01694	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
06f92e37-4b51-42d5-ad0a-989f30b4bd8d	genevieve_langworth62@gmail.com	JBrAyQzwVGbv2Zq_2r8r	Lew57	Elne	Ambitus ager varius xiphias.	https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/74.jpg	42.60981	2.97553	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
18ae8913-6649-44b0-b35e-813108e27435	cristian61@yahoo.com	P5wWpeV3aGevQ5Z7MtEW	Treva90	Elne	Adfectus aggero texo desparatus ducimus necessitatibus tres fugiat quibusdam nostrum.	https://avatars.githubusercontent.com/u/23056760	42.61153	2.9701500000000003	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
c7981f69-0eab-44b4-ae23-c29c8f9e5cb2	curtis.harber@yahoo.com	C22L0Nw65pWx8Zzneff9	Gretchen.Greenfelder	Céret	Aqua arbitro auditor.	https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/512/93.jpg	42.48874	2.74328	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
225a5dbe-8fdc-40fc-9a22-f4cbf5c2f853	josephine47@gmail.com	4FABGrXVefo7P9QVYiUb	Donato.Lehner	Saint-Cyprien	Adeptio antepono illo fugiat valens cui alius abduco.	https://avatars.githubusercontent.com/u/51378277	42.61871	3.02096	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
3d310143-6049-4e69-b7b0-6b27e7a3c34b	lauretta41@gmail.com	VyHut7mZbMZnmlgXQUWe	Antonetta.Douglas99	Perpignan	Animadverto conforto magni acerbitas sperno quisquam allatus tabula capio.	https://avatars.githubusercontent.com/u/11937683	42.69426	2.90187	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
bb44c842-791d-46cc-b0e1-7b3e805c0232	van23@gmail.com	vD3zRkJSCLok_aASlH0k	Thomas58	Prades	Stipes theologus somniculosus.	https://avatars.githubusercontent.com/u/12052222	42.61789	2.4192	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
49ace313-2827-436a-90f2-090f5f571e52	bradley.hilll@yahoo.com	ffnLuCnw9bzqS6ZQ3auP	Donald_Swaniawski-Hodkiewicz	Prades	Cumque coruscus vero suggero demulceo perferendis sophismata antepono cubitum charisma.	https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/2.jpg	42.61786	2.4261000000000004	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
9da9f201-7a76-43d3-973f-be5dab086dbb	steve.swaniawski@hotmail.com	JZyzSY4zvRlVVmOeNi_A	Monica_Konopelski27	Argelès-sur-Mer	Expedita caritas tolero amet velum caput supellex conspergo cattus admoneo.	https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/512/13.jpg	42.54669	3.02991	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
e1b9bd1b-9a4d-4038-917d-28f896b5f152	otha.doyle12@yahoo.com	jpmiNT9TDbyEOgkC8gxx	Marlene_Connelly8	Rivesaltes	Cognomen suus triduana cruentus currus.	https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/60.jpg	42.77212	2.87011	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
cbe1ff36-f445-4436-a3f6-c78507a72c7b	brenda_stiedemann90@gmail.com	fjuC13MbOSQHY_h_Ro38	Cecil.Bosco4	Perpignan	Tristis toties spero certe vapulus tergiversatio.	https://avatars.githubusercontent.com/u/42203846	42.69489	2.90029	2026-07-24 13:53:53.888592	2026-07-24 13:53:53.888592
d2a0b118-8f41-4a12-8d36-87e5d920c9e8	diag-test3-1784901394@example.com	$argon2id$v=19$m=65536,t=3,p=4$/WR1ao5zdyTshjEcG75/bQ$HkGcxzhcgGrrFaOn3oCSLir6InQmCIochMZFsyMzOVA	DiagTest3	\N	\N	\N	\N	\N	2026-07-24 13:56:34.127712	2026-07-24 13:56:34.127712
8cf78a3d-c776-477e-9c45-b88a5cba8507	e2e-1784903065614@example.com	$argon2id$v=19$m=65536,t=3,p=4$MxUcomdEuKv5dVMF4d4APw$N3tevs6i1ZlWLZGJoqR9pRAfGn7cxU+ENQxiXfXGLaU	E2ETestUser	\N	\N	\N	\N	\N	2026-07-24 14:24:25.882034	2026-07-24 14:24:25.882034
3a889714-c016-4356-8507-458f552edbe5	el.dasilva@yahoo.fr	$argon2id$v=19$m=65536,t=3,p=4$/L5/G7ZFoBAgT8Dv1Vt21A$GD4zQFNgnW8tD5LFu7q0SQTI127m9owc/5dDwerrfoM	Elo	\N	\N	\N	\N	\N	2026-07-24 14:27:24.406949	2026-07-24 14:27:24.406949
1176c293-ad91-45e8-8a74-1bbd2ee9c58a	fav-test-1785421334@example.com	$argon2id$v=19$m=65536,t=3,p=4$WU/bAnxB54OoKLupPRRmdg$4IlGsfnTXnfS4ODyVsrJ5EXPZ3kZ7I4CGaZ34aERnYY	FavTest	\N	\N	\N	\N	\N	2026-07-30 14:22:14.709556	2026-07-30 14:22:14.709556
\.


--
-- Data for Name: geocode_settings; Type: TABLE DATA; Schema: tiger; Owner: partners66
--

COPY tiger.geocode_settings (name, setting, unit, category, short_desc) FROM stdin;
\.


--
-- Data for Name: pagc_gaz; Type: TABLE DATA; Schema: tiger; Owner: partners66
--

COPY tiger.pagc_gaz (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- Data for Name: pagc_lex; Type: TABLE DATA; Schema: tiger; Owner: partners66
--

COPY tiger.pagc_lex (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- Data for Name: pagc_rules; Type: TABLE DATA; Schema: tiger; Owner: partners66
--

COPY tiger.pagc_rules (id, rule, is_custom) FROM stdin;
\.


--
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: partners66
--

COPY topology.topology (id, name, srid, "precision", hasz) FROM stdin;
\.


--
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: partners66
--

COPY topology.layer (topology_id, layer_id, schema_name, table_name, feature_column, feature_type, level, child_id) FROM stdin;
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: partners66
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, true);


--
-- Name: topology_id_seq; Type: SEQUENCE SET; Schema: topology; Owner: partners66
--

SELECT pg_catalog.setval('topology.topology_id_seq', 1, false);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: partners66
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_activity_id_unique; Type: CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_activity_id_unique UNIQUE (activity_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: opinion opinion_pkey; Type: CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.opinion
    ADD CONSTRAINT opinion_pkey PRIMARY KEY (id);


--
-- Name: participations participations_pkey; Type: CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.participations
    ADD CONSTRAINT participations_pkey PRIMARY KEY (id);


--
-- Name: participations participations_user_id_activity_id_unique; Type: CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.participations
    ADD CONSTRAINT participations_user_id_activity_id_unique UNIQUE (user_id, activity_id);


--
-- Name: sport_favorites sport_favorites_user_id_sport_id_pk; Type: CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.sport_favorites
    ADD CONSTRAINT sport_favorites_user_id_sport_id_pk PRIMARY KEY (user_id, sport_id);


--
-- Name: sports sports_name_key; Type: CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.sports
    ADD CONSTRAINT sports_name_key UNIQUE (name);


--
-- Name: sports sports_pkey; Type: CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.sports
    ADD CONSTRAINT sports_pkey PRIMARY KEY (id);


--
-- Name: user_sports user_sports_pkey; Type: CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.user_sports
    ADD CONSTRAINT user_sports_pkey PRIMARY KEY (user_id, sport_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: activities activities_creator_id_users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_creator_id_users_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: activities activities_sport_id_sports_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_sport_id_sports_id_fkey FOREIGN KEY (sport_id) REFERENCES public.sports(id);


--
-- Name: conversations conversations_activity_id_activities_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_activity_id_activities_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversations_id_conversations_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversations_id_conversations_id_fkey FOREIGN KEY (conversations_id) REFERENCES public.conversations(id);


--
-- Name: messages messages_users_id_users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_users_id_users_id_fkey FOREIGN KEY (users_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_users_id_users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_users_id_users_id_fkey FOREIGN KEY (users_id) REFERENCES public.users(id);


--
-- Name: opinion opinion_users_id_users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.opinion
    ADD CONSTRAINT opinion_users_id_users_id_fkey FOREIGN KEY (users_id) REFERENCES public.users(id);


--
-- Name: participations participations_activity_id_activities_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.participations
    ADD CONSTRAINT participations_activity_id_activities_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;


--
-- Name: participations participations_user_id_users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.participations
    ADD CONSTRAINT participations_user_id_users_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sport_favorites sport_favorites_sport_id_sports_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.sport_favorites
    ADD CONSTRAINT sport_favorites_sport_id_sports_id_fk FOREIGN KEY (sport_id) REFERENCES public.sports(id) ON DELETE CASCADE;


--
-- Name: sport_favorites sport_favorites_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.sport_favorites
    ADD CONSTRAINT sport_favorites_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_sports user_sports_sport_id_sports_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.user_sports
    ADD CONSTRAINT user_sports_sport_id_sports_id_fkey FOREIGN KEY (sport_id) REFERENCES public.sports(id) ON DELETE CASCADE;


--
-- Name: user_sports user_sports_user_id_users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: partners66
--

ALTER TABLE ONLY public.user_sports
    ADD CONSTRAINT user_sports_user_id_users_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 8E7MfRrFNhbVNNplitOEfK4XvqgbOWfXnfKJygG5HN5EEmUEyHBXsBAinl44Sje

