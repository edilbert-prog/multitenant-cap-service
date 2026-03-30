import React from 'react';
import Header from './Header';
import { useLocation } from 'react-router-dom';

type Props = {
    children?: React.ReactNode;
};

export default function GlobalHeader(props: Props) {
    const location = useLocation();

    return (
        <div>
            {location.pathname !== '/' && <Header />}
            {props.children}
        </div>
    );
}
