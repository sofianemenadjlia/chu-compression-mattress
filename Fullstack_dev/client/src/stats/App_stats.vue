<template>
    <div>
        <b-navbar toggleable="lg" type="dark" variant="info">

            <b-navbar-brand href="/">
                <img src="../assets/chu_logo_original.png" width="50" height="50" alt="">
            </b-navbar-brand>

            <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

            <b-collapse id="nav-collapse" is-nav>
                <b-navbar-nav>
                    <b-nav-item href="/booking">Réserver un matelas</b-nav-item>
                    <b-nav-item href="/management">Gestion de matelas</b-nav-item>
                    <b-nav-item href="/stats" active>Statistiques</b-nav-item>
                    <b-nav-item href="/history">Historique</b-nav-item>
                </b-navbar-nav>

            </b-collapse>
        </b-navbar>
        <div style="margin-left:auto;margin-right:auto;width:25%;margin-top:10%">
            <b-alert show variant="warning" style="text-align:center">En cours de construction ^v^</b-alert>
        </div>
    </div>
</template>