// ~/client/src/components/MainMenu.js
import React from 'react';
import { Link } from 'react-router-dom';

export default function MainMenu() {
    return (
        <div className="main-menu">
            <Link to="/" className="menu-button">모항</Link>
            <Link to="/formation" className="menu-button">편성</Link>
            <Link to="/supply" className="menu-button">보급</Link>
            <Link to="/repair" className="menu-button">수리</Link>
            <Link to="/remodel" className="menu-button">개조</Link>
            <Link to="/factory" className="menu-button">공창</Link>
            <Link to="/sortie" className="menu-button action-sortie">출격</Link>
            <hr />
            <Link to="/wiki/ships" className="menu-button">도감</Link>
        </div>
    );
}