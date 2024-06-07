import requests
import json

address = "http://localhost:8080/api/"

def add_mattress(mattress_number):
    parameters = {
            "id":str(mattress_number),
            "etat":"Bon",
            "occupation":"2000/01/01",
            "urgence":"false",
            "data":{},
            "remarque_matelas":"test_1002"
            }
    r = requests.post(address, json=parameters)
    return r.content.decode()

def delete_mattress(mattress_number):
    parameters = {
        "id":str(mattress_number)
    }
    r = requests.delete(address, json=parameters)
    return r.content.decode()

