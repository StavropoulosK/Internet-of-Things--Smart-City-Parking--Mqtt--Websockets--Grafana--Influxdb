import requests

def getAmea_sensorId():
    locations = get_locations()
    amea_ids = [item['id'] for item in locations if item['isAmea']]
    return amea_ids

def get_locations():
    url = "https://patra.smartiscity.gr/api/api.php?func=parkingAll"

    try:
        response = requests.get(url)
        if response.status_code != 200:
            print('2')
            print("Error: ", response.status_code)
            return None

        data = response.json()
        
        
        locations = [{
            "id": parking["id"],
            "lat": parking["Lat"],
            "lng": parking["Lon"],
            "isAmea": parking["Type"] == "ΑΜΕΑ"
            # "isAmea": parking["IsAmea"]
            } for parking in data
        ]
        
        return locations[:100]

    except Exception as e:
        print("Error: ", e)
        return None

if __name__ == "__main__":
    print(get_locations())
    # locations = get_locations()
    # print(locations)
    # amea_ids = [item['id'] for item in locations if item['isAmea']]

    # print(amea_ids)
    # print(sum([1 for location in locations if location["isAmea"]]), "Amea spots")

locations = [
    (38.24452980649084, 21.72979870807786),
    (38.24449898766099, 21.729837948928942),
    (38.244465186348684, 21.72988731645128),
    (38.244426414235804, 21.729939215641433),
    (38.2443786946839, 21.72998225399424),
    (38.24436179400174, 21.73002276067923),
    (38.24432699846397, 21.73005693819419),
    (38.24429518538932, 21.73009744487918),
    (38.244236529996456, 21.73015693907277),
    (38.24420074024197, 21.730199977425574),
    (38.24407945260447, 21.730448080870392),
    (38.244043662772654, 21.730489853389294),
    (38.24399594296946, 21.73055061341679),
    (38.24396015309653, 21.730603778440845),
    (38.243913427402546, 21.73065061429537),
    (38.24388459664023, 21.73069618431599),
    (38.24383588256755, 21.730749349340044),
    (38.2437861742965, 21.730810109367535),
    (38.24375137848653, 21.730855679388153),
    (38.24371061765937, 21.73089365440534),
    (38.24368079264943, 21.730940490259865),
    (38.2436430142859, 21.730978465277047),
    (38.24397407138254, 21.730483524219764),
    (38.24393828149882, 21.73053668924382),
    (38.243905474089956, 21.730569600925378),
    (38.243870678337096, 21.730603778440845),
    (38.24384781254756, 21.730643019291936),
    (38.24381003427085, 21.730688589312553),
    (38.24377623263819, 21.730718969326297),
    (38.243746407655166, 21.730770868516448),
    (38.243684769318136, 21.730840489381283),
    (38.24363903761492, 21.730903781076588),
    (38.24360921257561, 21.730954414432833),
    (38.24430352620474, 21.731008293973794),
    (38.24426982140982, 21.731053891527143),
    (38.24424138297694, 21.73108876024441),
    (38.24420346504912, 21.731142404424823),
    (38.24416976020782, 21.731186660873657),
    (38.24414553484344, 21.731222870695436),
    (38.2441097234205, 21.731273832666822),
    (38.24407707181359, 21.73131138359311),
    (38.24405442633566, 21.73134491120587),
    (38.244025461179234, 21.731375086057348),
    (38.2439843833012, 21.731424036371973),
    (38.24309634999095, 21.72799658730948),
    (38.2430773907309, 21.728020727190664),
    (38.24306264463633, 21.72805023148989),
    (38.24305000512432, 21.72808040634137),
    (38.243029992559144, 21.728095158490984),
    (38.2430120865751, 21.728132709417274),
    (38.24299681382049, 21.72816020205973),
    (38.24296732159567, 21.728188365254447),
    (38.24294520241921, 21.728209152374358),
    (38.24292992965058, 21.728233962807792),
    (38.242908337109064, 21.72827017262942),
    (38.2428741050196, 21.72831644073502),
    (38.2428425061535, 21.728365391049643),
    (38.24282196688144, 21.728376119885407),
    (38.242796687771516, 21.72840897694591),
    (38.242779835026674, 21.728440492901903),
    (38.24274560287671, 21.728484078798488),
    (38.24273191001221, 21.728519618068006),
    (38.24271769049635, 21.728515594754477),
    (38.242717163847566, 21.728519618068006),
    (38.242722430334, 21.72850888923175),
    (38.24269820448732, 21.728553145680586),
    (38.24267292533436, 21.728575273905005),
    (38.24266713219393, 21.728602095995214),
    (38.24262131370151, 21.728655740175416),
    (38.24259814112045, 21.7286859150269),
    (38.24258444822819, 21.72871005490809),
    (38.24498086332013, 21.730054944887463),
    (38.24496769750913, 21.73002946390177),
    (38.244951898532804, 21.730006665125096),
    (38.24492346036678, 21.729977831378125),
    (38.24488290962928, 21.729938268795074),
    (38.24485815786931, 21.729903400077806),
    (38.24482708649912, 21.729859143628964),
    (38.24479812165052, 21.729824274911696),
    (38.24477652966499, 21.729800805582773),
    (38.24474124518701, 21.72974246753657),
    (38.2450553706693, 21.730155149985624),
    (38.2451017142575, 21.73020342974799),
    (38.24512909909119, 21.730242992331043),
    (38.24514963770965, 21.730279202152822),
    (38.24517491600139, 21.730307365347535),
    (38.24519545460693, 21.730324799706167),
    (38.24523389864786, 21.730370397259517),
    (38.2452539089922, 21.7330776665907),
    (38.2452907731118, 21.733031398485092),
    (38.24532079102393, 21.7329925064543),
    (38.24534606925613, 21.732973730991155),
    (38.24537556051592, 21.732921427915254),
    (38.24540557839304, 21.732887900302497),
    (38.245436122886865, 21.73285571379425),
    (38.24547719994457, 21.73281413955443),
    (38.245513537324115, 21.73277122421023),
    (38.245534602462364, 21.73274037880649),
    (38.245580945745026, 21.732686064073828),
    (38.24562465586194, 21.732641807625132),
    (38.24564835410627, 21.73261498553496),
    (38.24565993991159, 21.732594868967304),
    (38.24567995175277, 21.732572740742885),
    (38.24570207009715, 21.732547259757187),
]
