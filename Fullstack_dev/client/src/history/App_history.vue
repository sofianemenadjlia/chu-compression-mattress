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
                    <b-nav-item href="/history" active>Historique</b-nav-item>
                </b-navbar-nav>

            </b-collapse>
        </b-navbar>

        <div id="tablediv">
            <div class="mb-3">
                <b-button  variant="danger" @click="msgDeleteHistory()" >Supprimer l'historique</b-button>
            </div>

            <b-table
                    :items="items"
                    :fields="fields"
                    :sort-by.sync="sortBy"
                    :sort-desc.sync="sortDesc"
                    show-empty
                    striped
                    hover
                    responsive
            >

                <template v-slot:cell(date)="date"> {{displayFormatted(date.value)}} </template>
            </b-table>
        </div>
    </div>
</template>

<script>
    import axios from "axios";
    import moment from "moment";

    export default {
        name: "App_history",
        data() {
            return {
                sortBy: 'date',
                sortDesc: true,
                response: "",
                errors: "",
                items: [],
                fields: [{key :'date', sortable : true}, {key :'description', sortable : false}],
            }
        },

        created: function () {
            this.getHistory();
        },

        methods: {
            saveToHistory(description) {
                axios.post("/api/addToHistory", {
                    date: new Date(),
                    description: description
                })
                    .then(response => {
                        this.response = response;
                    })
                    .catch(e => {
                        alert(e);
                        this.errors = e;
                    });
            },

            getHistory: function () {
                axios
                    .get("/api/getHistory")
                    .then(response => {
                        this.items = response.data;
                    })
                    .catch(e => {
                        alert(e);
                        this.errors = e;
                    });
            },

            deleteHistory: function () {
                axios
                    .delete("/api/deleteHistory")
                    .then(response => {
                        this.response = response;
                        this.getHistory();
                        this.makeToast(
                            "b-toaster-top-center",
                            "Succès !",
                            "La suppression de l'historique a été realisée avec succès !",
                            "success"
                        );
                    })
                    .catch(e => {
                        alert(e);
                        this.errors = e;
                    });

            },

            displayFormatted(date) {
                return moment(date).locale("fr").format("DD MMMM YYYY HH:mm");
            },

            msgDeleteHistory() {
                this.$bvModal.msgBoxConfirm(
                    "L'historique va être supprimé de la base de donnée, êtes-vous sûr ?",
                    {
                        title: "Veuillez confirmer",
                        size: "sm",
                        buttonSize: "sm",
                        okVariant: "danger",
                        okTitle: "Confirmer",
                        cancelTitle: "Annuler",
                        footerClass: "p-2",
                        hideHeaderClose: false,
                        centered: true
                    }
                )
                    .then(value => {
                        if (value) {
                            this.deleteHistory();
                        }
                    })
                    .catch(err => {
                        alert(err);
                    });
            },

            makeToast(toaster, title, content, variant, append = false) {
                this.$bvToast.toast(`${content}`, {
                    title: `${title}`,
                    toaster: toaster,
                    solid: true,
                    variant: variant,
                    appendToast: append
                });
            }
        }
    }

</script>

<style scoped>

</style>