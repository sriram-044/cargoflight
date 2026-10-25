--
-- PostgreSQL database dump
--

\restrict u8ngesghIumHfcxsMWg1lC57eEoz7sVu3MW8ePB8lwak4GnPfRtlB37FC8tGTM6

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: airbaggage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.airbaggage (
    baggage_id integer NOT NULL,
    baggage_tag character varying(50) NOT NULL,
    passenger_name character varying(100),
    flight_number character varying(20),
    current_status character varying(50) DEFAULT 'CHECKED_IN'::character varying,
    terminal character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.airbaggage OWNER TO postgres;

--
-- Name: airbaggage_baggage_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.airbaggage_baggage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.airbaggage_baggage_id_seq OWNER TO postgres;

--
-- Name: airbaggage_baggage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.airbaggage_baggage_id_seq OWNED BY public.airbaggage.baggage_id;


--
-- Name: baggage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.baggage (
    baggage_id integer NOT NULL,
    baggage_tag character varying(50) NOT NULL,
    passenger_name character varying(100),
    flight_number character varying(20),
    current_status character varying(50) DEFAULT 'CHECKED_IN'::character varying,
    terminal character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.baggage OWNER TO postgres;

--
-- Name: baggage_baggage_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.baggage_baggage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.baggage_baggage_id_seq OWNER TO postgres;

--
-- Name: baggage_baggage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.baggage_baggage_id_seq OWNED BY public.baggage.baggage_id;


--
-- Name: airbaggage baggage_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.airbaggage ALTER COLUMN baggage_id SET DEFAULT nextval('public.airbaggage_baggage_id_seq'::regclass);


--
-- Name: baggage baggage_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.baggage ALTER COLUMN baggage_id SET DEFAULT nextval('public.baggage_baggage_id_seq'::regclass);


--
-- Data for Name: airbaggage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.airbaggage (baggage_id, baggage_tag, passenger_name, flight_number, current_status, terminal, created_at) FROM stdin;
1	BAG1001	Test Passenger	AI202	CHECKED_IN	T1	2026-10-15 11:42:15.391732
\.


--
-- Data for Name: baggage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.baggage (baggage_id, baggage_tag, passenger_name, flight_number, current_status, terminal, created_at) FROM stdin;
1	BAG1001	Test Passenger	AI202	CHECKED_IN	T1	2026-10-15 11:39:24.974655
\.


--
-- Name: airbaggage_baggage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.airbaggage_baggage_id_seq', 1, true);


--
-- Name: baggage_baggage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.baggage_baggage_id_seq', 2, true);


--
-- Name: airbaggage airbaggage_baggage_tag_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.airbaggage
    ADD CONSTRAINT airbaggage_baggage_tag_key UNIQUE (baggage_tag);


--
-- Name: airbaggage airbaggage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.airbaggage
    ADD CONSTRAINT airbaggage_pkey PRIMARY KEY (baggage_id);


--
-- Name: baggage baggage_baggage_tag_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.baggage
    ADD CONSTRAINT baggage_baggage_tag_key UNIQUE (baggage_tag);


--
-- Name: baggage baggage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.baggage
    ADD CONSTRAINT baggage_pkey PRIMARY KEY (baggage_id);


--
-- PostgreSQL database dump complete
--

\unrestrict u8ngesghIumHfcxsMWg1lC57eEoz7sVu3MW8ePB8lwak4GnPfRtlB37FC8tGTM6

