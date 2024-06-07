<template>
    <div>
        <!-- Navbar -->
        <b-navbar toggleable="lg" type="dark" variant="info">
            <b-navbar-brand href="/">
                <img src="../assets/chu_logo_original.png" width="50" height="50" alt />
            </b-navbar-brand>

            <b-navbar-toggle target="nav-collapse" />

            <!-- Navbar item responsive -->
            <b-collapse id="nav-collapse" is-nav>
                <b-navbar-nav>
                    <b-nav-item href="/booking">Réserver un matelas</b-nav-item>
                    <b-nav-item href="/management" active>Gestion de matelas</b-nav-item>
                    <b-nav-item href="/history">Historique</b-nav-item>
                </b-navbar-nav>
            </b-collapse>
        </b-navbar>

        <!-- Manage mattresses button -->
        <div id="manage-button">
            <b-button variant="primary" v-b-modal.add_mattress>Ajouter un matelas</b-button>
        </div>


        <!-- Add mattress pop-up -->
        <b-modal id="add_mattress" ref="modal_add_mattress" title="Ajouter un matelas" @show= "resetModal" @hidden="resetModal">

            <template v-slot:modal-footer="{ ok, cancel }">
                <b-button variant="danger" @click="cancel()">Cancel</b-button>
                <b-button
                        variant="success"
                        :disabled="!correctId || remarque.length > 300"
                        @click="saveMattress(id,etat_select,remarque)"
                >OK</b-button>
            </template>

            <div class="modal-body">
                <b-form>
                    <label>ID du matelas :</label>
                    <b-form-input
                            v-model="id"
                            :state="correctId"
                            placeholder="Entrez l'ID du matelas à ajouter"
                    />
                    <b-form-invalid-feedback :state="correctId">ID de matelas non valide ou déjà utilisé</b-form-invalid-feedback>
                </b-form>

                <b-form>
                    <label>État :</label>
                    <b-form-select
                            v-model="etat_select"
                            :options="options"
                            value-field="item"
                            text-field="name"
                    />
                </b-form>

                <b-form>
                    <label>Remarque :</label>
                    <b-form-input
                            v-model="remarque"
                            :state="correctRemarque"
                            placeholder="Informations supplémentaires concernant le matelas"
                            :maxlength="301"
                            trim
                    />
                    <b-form-invalid-feedback :state="correctRemarque">Entrez 300 caractères ou moins!</b-form-invalid-feedback>
                </b-form>
            </div>
        </b-modal>

        <!-- Update mattress pop-up-->
        <b-modal id="modify_mattress" ref="modal_modify_mattress" title="Modifier un matelas"  @hidden="resetModal">

            <template v-slot:modal-footer="{ ok, cancel }">
                <b-button variant="danger" @click="cancel()">Cancel</b-button>
                <b-button
                        variant="success"
                        :disabled=" !correctModifyId || remarque.length > 300"
                        @click="modifyMattress"
                >OK</b-button>
            </template>

            <div class="modal-body">
                <b-form>
                    <label>ID du matelas :</label>
                    <b-form-input
                            v-model="id"
                            :state="correctModifyId"
                            placeholder="Entrez un ID pour ce matelas"
                    />
                    <b-form-invalid-feedback :state="correctModifyId">ID de matelas non valide ou déjà utilisé</b-form-invalid-feedback>
                </b-form>

                <b-form>
                    <label>État :</label>
                    <b-form-select
                            v-model="etat_select"
                            :options="options"
                            value-field="item"
                            text-field="name"
                    />
                </b-form>

                <b-form>
                    <label>Remarque :</label>
                    <b-form-input
                            v-model="remarque"
                            :state="correctRemarque"
                            placeholder="Informations supplémentaires concernant le matelas"
                            :maxlength="301"
                            trim
                    />
                    <b-form-invalid-feedback :state="correctRemarque">Entrez 300 caractères ou moins!</b-form-invalid-feedback>
                </b-form>

            </div>
        </b-modal>

        <b-modal id="modify_reservation" ref="modal_modify_reservation" title="Modifier une Réservation"  @hidden="onHiddenModalReservation">
            <template v-slot:modal-footer="{ ok, cancel }">
                <b-button size="sm" variant="danger" @click="cancel()">Cancel</b-button>
                <b-button
                        size="sm"
                        variant="success"
                        :disabled="!(correctNIP && validScannerDate && mepAfterScanner && ftrAfterMep)"
                        @click="modifyReservation"
                >OK</b-button>
            </template>
            <div class="modal-body">
                <div class="form-group">
                    <b-form>
                        <b-form-group
                                id="reservation-form"
                                label="NIP :"
                                label-for="reservation-form-1"
                                description="Entrez le NIP du patient pour ce matelas."
                        >
                            <b-form-input
                                    id="reservation-form-1"
                                    v-model="reservationForm.nip"
                                    type="number"
                                    :state="correctNIP"
                                    required
                                    placeholder="Saisissez un NIP"
                            ></b-form-input>
                            <b-form-invalid-feedback
                                    id="reservation-form-1-feedback"
                            >Le NIP saisi est manquant ou invalide !</b-form-invalid-feedback>
                        </b-form-group>


                        <b-form-group
                                id="reservation-form-2"
                                label="Date scanner :"
                                label-for="reservation-form-2"
                        >
                            <b-form-input
                                    id="reservation-form-2"
                                    v-model="reservationForm.scanner_date"
                                    type="date"
                                    :state="validScannerDate"
                                    required
                                    placeholder="Entrez une date pour le scanner"
                            ></b-form-input>
                            <b-form-invalid-feedback
                                    id="reservation-form-2-feedback"
                            >La date du scanner doit être autorisée par le calendrier.</b-form-invalid-feedback>
                        </b-form-group>

                        <b-form-group id="reservation-form-3" label="Date MEP :" label-for="reservation-form-3">
                            <b-form-input
                                    id="reservation-form-3"
                                    v-model="reservationForm.mep_date"
                                    type="date"
                                    :state="mepAfterScanner"
                                    required
                                    placeholder="Entrez une date MEP"
                            ></b-form-input>
                            <b-form-invalid-feedback
                                    id="reservation-form-3-feedback"
                            >La date MEP ne peut pas être avant celle du scanner et doit être autorisée par le calendrier.</b-form-invalid-feedback>
                        </b-form-group>

                        <b-form-group
                                id="reservation-form-4"
                                label="Nombre de séances :"
                                label-for="reservation-form-4"
                        >
                            <b-form-input
                                    id="reservation-form-4"
                                    v-model="reservationForm.session_nb"
                                    type="text"
                                    required
                                    placeholder="Saisissez les informations sur les séances"
                            ></b-form-input>
                        </b-form-group>

                        <b-form-group id="reservation-form-5" label="Date FTR :" label-for="reservation-form-5">
                            <b-form-input
                                    id="reservation-form-5"
                                    v-model="reservationForm.ftr_date"
                                    type="date"
                                    :state="ftrAfterMep"
                                    required
                                    placeholder="Enter une date FTR"
                            ></b-form-input>
                            <b-form-invalid-feedback
                                    id="reservation-form-5-feedback"
                            >La date FTR ne peut pas se situer avant la date MEP et doit être autorisée par le calendrier.</b-form-invalid-feedback>
                        </b-form-group>

                        <b-form-group id="reservation-form-6" label="Remarque :" label-for="reservation-form-6">
                            <b-form-input id="reservation-form-6" v-model="reservationForm.remark" type="text"></b-form-input>
                        </b-form-group>

                    </b-form>
                </div>
            </div>
        </b-modal>

        <!-- Search bar -->
        <div id="tablediv">
      <span>
        <h1>Liste des matelas</h1>
      </span>

            <b-col lg="3" class="my-1">
                <b-input-group prepend="Filtrer">
                    <b-form-input
                            v-model="filter"
                            type="search"
                            id="filterInput"
                            placeholder="Tapez pour rechercher"
                    />
                    <b-input-group-append>
                        <b-button variant="primary" :disabled="!filter" @click="filter = ''">Effacer</b-button>
                    </b-input-group-append>
                </b-input-group>
            </b-col>

            <b-col lg="5">
                <b-form-group label="Filtrer sur" label-cols-sm="3" label-align-sm="right" label-size="sm" description="Ne rien cocher pour filtrer sur toutes les données">
                    <b-form-checkbox-group v-model="filterOn">
                        <b-form-checkbox value="id">Id</b-form-checkbox>
                        <b-form-checkbox value="etat">Etat</b-form-checkbox>
                        <b-form-checkbox value="remarque_matelas">Remarque</b-form-checkbox>
                    </b-form-checkbox-group>
                </b-form-group>
            </b-col>

            <!-- Mattresses list -->
            <b-table
                    :items="items"
                    :fields="fields"
                    :filter="filter"
                    :filterIncludedFields="filterOn"
                    :sort-by="sortBy"
                    striped
                    fixed
                    show-empty
                    hover
                    responsive
            >

                <template v-slot:cell(etat)="etat">
                    <b-badge v-if="etat.value === 'Bon'" variant="success">Bon</b-badge>
                    <b-badge v-else-if="etat.value === 'HS'" variant="warning">HS</b-badge>
                    <b-badge v-else variant="danger">Urgences uniquement</b-badge>
                </template>

                <template v-slot:cell(occupation)="occupation">
                    <b-badge v-if="equalsNullDate(occupation.value)" variant="info">Libre</b-badge>
                    <b-badge v-else-if="equalsHsDate(occupation.value)" variant="warning">HS</b-badge>
                    <span v-else>{{displayFormatted(occupation.value)}}</span>
                </template>

                <template v-slot:cell(Action)="row">
                    <b-button size="sm" @click="details(row)" class="mx-1" variant="info"> Détails</b-button>
                    <b-button size="sm" @click="modifyMattressModal(row.item._id,row.item.id,row.item.etat,row.item.remarque_matelas,row.item.occupation)"  class="mx-1" variant="success" >Modifier</b-button>
                    <b-button size="sm" @click="showMsgDeleteMattress(row.item._id, row.item.id)" class="mx-1" variant="danger">Supprimer</b-button>
                </template>


                <!-- Mattress reservations' array -->
                <template v-slot:row-details="row">
                    <b-card>
                        <b-table
                                :items="row.item.data"
                                :fields="fields_data"
                                fixed
                                show-empty
                        >
                            <template v-slot:cell(date_scanner)="date">{{displayFormatted(date.value)}}</template>

                            <template v-slot:cell(date_mep)="date">{{displayFormatted(date.value)}}</template>

                            <template v-slot:cell(date_ftr)="date">{{displayFormatted(date.value)}}</template>

                            <template v-slot:cell(Action)="row">
                                <b-button size="sm" @click="modifyReservationModal(row.item._id,row.item.nip,row.item.date_scanner,row.item.date_mep,row.item.date_ftr,row.item.nombre_seances,row.item.remarque)"  class="mx-1" variant="success" >Modifier</b-button>
                                <b-button size="sm" @click="showMsgDeleteReservation(row.item._id)"  class="mx-1" variant="danger" >Supprimer</b-button>
                            </template>

                        </b-table>
                    </b-card>
                </template>
            </b-table>
        </div>
    </div>
</template>

<script>
    import axios from "axios";
    import moment from "moment";

    export default {
        name: "app",

        computed: {

            correctId() {
                if (this.id.length == 0) {
                    return null;
                }
                for (let i = 0; i < this.items.length; i++) {
                    if (this.id == this.items[i]["id"]) {
                        return false;
                    }
                }
                if (this.id % 1 !== 0) {
                    return false;
                }
                return !isNaN(this.id);
            },

            correctModifyId() {
                if (this.id.length === 0) {
                    return null;
                }
                for (let i = 0; i < this.items.length; i++) {
                    if (this.id != this.old_id && this.id == this.items[i]["id"]) {
                        return false;
                    }
                }
                if (this.id % 1 !== 0) {
                    return false;
                }
                return !isNaN(this.id);
            },

            correctRemarque() {
                if (this.remarque.length === 0) {
                    return null;
                }
                return this.remarque.length <= 300;
            },

            correctNIP(){
                if(this.reservationForm.nip.length === 0){
                    return null;
                }
                return !isNaN(this.reservationForm.nip) && this.reservationForm.nip > 0 && (this.reservationForm.nip % 1 === 0);
            },

            validScannerDate() {
                if (this.isUndefined(this.reservationForm.scanner_date)) {
                    return null;
                }
                return true;
            },

            mepAfterScanner() {
                if (this.isUndefined(this.reservationForm.mep_date)) {
                    return null;
                }
                return this.reservationForm.mep_date > this.reservationForm.scanner_date;
            },

            ftrAfterMep() {
                if (this.isUndefined(this.reservationForm.ftr_date)) {
                    return null;
                }
                return this.reservationForm.ftr_date > this.reservationForm.mep_date;
            }
        },

        data() {
            return {
                sortBy: 'id',
                options: [
                    { item: "Bon", name: "Bon" },
                    { item: "Urgences uniquement", name: "Urgences uniquement" },
                    { item: "HS", name: "HS" }
                ],
                items: [],
                bdd_id:"",
                id: "",
                old_id: "",
                etat: "",
                etat_select: null,
                remarque: "",
                occupation: null,
                fields: [
                    {key :'id', sortable : true},
                    {key :'etat', sortable : true},
                    {key :'occupation', sortable : true},
                    {key :'remarque_matelas', sortable : false},
                    {key :'Action', sortable : false}
                ],
                fields_data: [
                    "nip",
                    "date_scanner",
                    "date_mep",
                    "date_ftr",
                    "nombre_seances",
                    "remarque",
                    "statut",
                    "Action"
                ],
                reservationForm : {
                    mattress_id : "",
                    reservation_id : '',
                    nip : '' ,
                    scanner_date : '' ,
                    mep_date : '' ,
                    session_nb : '' ,
                    ftr_date : '' ,
                    remark : '' ,
                },
                response: "",
                errors: "",
                filter: null,
                filterOn: ["id"],
                nullDate: moment(0),
                hsDate: moment(1)
            };
        },

        created: function() {
            this.getMattress();
        },

        methods: {
            details(row){
                row.toggleDetails();
                this.bdd_id = row.item._id;
                this.id = row.item.id;
            },

            equalsNullDate(other) {
                return this.nullDate.isSame(moment(other));
            },

            equalsHsDate(other) {
                return this.hsDate.isSame(moment(other));
            },

            displayFormatted(date) {
                return moment(date).locale("fr").format("DD MMMM YYYY");
            },

            isUndefined(item) {
                return item == "" || item == undefined;
            },

            showMsgDeleteMattress(_id, id) {
                this.$bvModal
                    .msgBoxConfirm(
                        "Le matelas va être supprimé de la base de donnée, êtes-vous sûr ?",
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
                            this.deleteMattress(_id,id);
                        }
                    })
                    .catch(err => {
                        alert(err);
                    });
            },

            showMsgDeleteReservation(_idReservation) {
                this.$bvModal
                    .msgBoxConfirm(
                        "La réservation va être supprimé de la base de donnée, êtes-vous sûr ?",
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
                            this.deleteReservation(_idReservation);
                        }
                    })
                    .catch(err => {
                        alert(err);
                    });
            },

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

            saveMattress(newId, newEtat, newRemarque) {
                axios.post("/api/", {
                    id: newId,
                    etat: newEtat,
                    occupation: newEtat === "HS" ? this.hsDate : this.nullDate, //If HS save with hsDate for display
                    remarque_matelas: newRemarque,
                    is_locked: false,
                    data: []
                })
                    .then(response => {
                        this.response = response;
                        this.getMattress();
                        this.$refs.modal_add_mattress.hide();
                        if (response.data.success) {
                            let msg = "Ajout du matelas " + newId + " avec l'état " + newEtat;
                            msg += newRemarque.length==0?" sans remarque":" et la remarque \"" + newRemarque + "\"";
                            this.saveToHistory(msg);
                            this.makeToast(
                                "b-toaster-top-center",
                                "Succès !",
                                "L'ajout du matelas n°" + newId + " a été realisé avec succès !",
                                "success"
                            );
                        } else {
                            this.makeToast(
                                "b-toaster-top-center",
                                "Échec !",
                                "L'ajout du matelas n°" +
                                newId +
                                " a déjà été réalisé entre-temps !",
                                "danger"
                            );
                        }
                    })
                    .catch(e => {
                        alert(e);
                        this.errors = e;
                    });
            },

            modifyMattress() {
                let matelas;

                if(this.etat_select == "HS"){
                    matelas  = {
                        _id : this.bdd_id,
                        id: this.id,
                        etat: this.etat_select,
                        occupation: this.hsDate,
                        remarque_matelas: this.remarque
                    };
                }
                else{
                    matelas  = {
                        _id : this.bdd_id,
                        id: this.id,
                        etat: this.etat_select,
                        occupation: this.nullDate,
                        remarque_matelas: this.remarque
                    };
                }

                axios.put("/api/modifyMattress", matelas)
                    .then(response => {
                        this.response = response;
                        this.getMattress();
                        this.$refs.modal_modify_mattress.hide();
                        if (response.data.success) {
                            let msg = "Modification du matelas "  + this.id + " avec l'état " + this.etat_select;
                            msg += this.remarque.length==0?" sans remarque":" et la remarque \"" + this.remarque + "\"";
                            this.saveToHistory(msg);
                            this.makeToast(
                                "b-toaster-top-center",
                                "Succès !",
                                "La modification a été realisé avec succès !",
                                "success"
                            );
                        } else {
                            this.makeToast(
                                "b-toaster-top-center",
                                "Échec !",
                                "La modification du matelas n°" +
                                this.id +
                                " a déjà été réalisé entre-temps !",
                                "danger"
                            );
                        }
                    })
                    .catch(e => {
                        alert(e);
                        this.errors = e;
                    });
            },

            modifyReservation(){
                axios.put("/api/modifyReservation", this.reservationForm)
                    .then(response => {
                        this.response = response;
                        this.getMattress();
                        this.$refs['modal_modify_reservation'].hide();
                        if (response.data.success) {
                            let msg = "Modification d'une réservation sur le "  + this.id;
                            this.saveToHistory(msg);
                            this.makeToast(
                                "b-toaster-top-center",
                                "Succès !",
                                "La modification a été realisé avec succès !",
                                "success"
                            );
                        } else {
                            this.makeToast(
                                "b-toaster-top-center",
                                "Échec !",
                                "La modification du matelas n°" +
                                this.id +
                                " a déjà été réalisé entre-temps !",
                                "danger"
                            );
                        }
                    })
                    .catch(e => {
                        alert(e);
                        this.errors = e;
                    });

            },

            resetModal() {
                this.bdd_id = "";
                this.old_id = "";
                this.id = "";
                this.etat_select = null;
                this.remarque = "";
                this.occupation = "";
            },

            onHiddenModalReservation(){
                this.bdd_id = "";
                this.reservationForm.mattress_id = "";
                this.reservationForm.reservation_id = "";
                this.reservationForm.nip = "";
                this.reservationForm.scanner_date = "";
                this.reservationForm.mep_date = "";
                this.reservationForm.ftr_date = "";
                this.reservationForm.session_nb = "";
                this.reservationForm.remark = "";
            },

            modifyMattressModal(bdd_id,id,etat,remarque, occupation) {
                this.bdd_id = bdd_id;
                this.old_id = id;
                this.id = id;
                this.etat_select = etat;
                this.remarque = remarque;
                this.occupation = occupation;
                this.$refs.modal_modify_mattress.show();
            },

            modifyReservationModal(reservation_id,nip,date_scanner,date_mep,date_ftr,nombre_seances,remarque) {
                this.reservationForm.mattress_id = this.bdd_id;
                this.reservationForm.reservation_id = reservation_id;
                this.reservationForm.nip = nip;
                this.reservationForm.scanner_date = moment(date_scanner).format('YYYY-MM-DD');
                this.reservationForm.mep_date = moment(date_mep).format('YYYY-MM-DD');
                this.reservationForm.ftr_date = moment(date_ftr).format('YYYY-MM-DD');
                this.reservationForm.session_nb = nombre_seances;
                this.reservationForm.remark = remarque;
                this.$refs['modal_modify_reservation'].show();
            },

            getMattress: function() {
                axios.get("/api/")
                    .then(response => {
                        this.items = response.data;
                    })
                    .catch(e => {
                        this.errors = e;
                    });
            },

            deleteMattress: function(_id, id) {
                axios.delete("/api/", { data: { _id: _id } })
                    .then(response => {
                        this.response = response;
                        this.getMattress();
                        this.saveToHistory("Suppression du matelas "  + id);
                        this.makeToast(
                            "b-toaster-top-center",
                            "Succès !",
                            "La suppression du matelas n°" +
                            id +
                            " a été realisée avec succès !",
                            "success"
                        );
                    })
                    .catch(e => {
                        alert(e);
                        this.errors = e;
                    });
            },

            deleteReservation: function(_idReservation) {
                axios.delete("/api/deleteReservation", { data: {_idMattress: this.bdd_id,_idReservation:_idReservation } })
                    .then(response => {
                        this.response = response;
                        this.getMattress();
                        this.saveToHistory("Suppression d'une réservation sur le matelas " + this.id);
                        this.makeToast(
                            "b-toaster-top-center",
                            "Succès !",
                            "La suppression de la réservation a été realisée avec succès !",
                            "success"
                        );
                    })
                    .catch(e => {
                        alert(e);
                        this.errors = e;
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
    };
</script>

<style>
    #manage-button {
        margin: 1em;
        text-align: right;
    }
</style>