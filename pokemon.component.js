import COLORS from './Themes/colors.json' assert {type: 'json'};

class PokemonComponent {
    constructor() {
        this.compEle = document.querySelector('.main-wrapper');
        this.searchWrapper = this.compEle.querySelector('.search-wrapper');
        this.inputPokemon = this.searchWrapper.querySelector('.input-search-name');
        this.pokemonItems = this.compEle.querySelector('.pokemon-container');
        this.descriptionContainer = document.querySelector('.details-wrapper');
        this.evolutionContainer = document.querySelector('.pokemon-evolution');
        this.modalBg = document.querySelector('.background-modal');
        this.closeBtn = this.descriptionContainer.querySelector('.btn-close');
        this.nextBtn = this.descriptionContainer.querySelector('.btn-next');
        this.prevBtn = this.descriptionContainer.querySelector('.btn-prev');
        this.colorsMap = {};

        this.setRootColorValues();
        this.initializeComponent();

        this.pokemonItems.onreadystatechange = () => {
            if (document.readyState !== 'complete') {
                console.log('start');
            } else {
                console.log('end');
            }
        };
    }

    initializeComponent() {
        this.displayPokemonItems();
        this.inputPokemon.addEventListener('keyup', e => this.searchItemByName(e));

        [this.modalBg, this.closeBtn].forEach(ele => {
            ele.addEventListener('click', () => {
                this.modalBg.classList.toggle('hide-Item');
                this.descriptionContainer.classList.toggle('hide-Item');
            });
        });
    }

    handleOpenCloseModal() {
        const arr = [...this.pokemonItems.children];
        arr.forEach(item => {
            item.addEventListener('click', () => {
                this.modalBg.classList.toggle('hide-Item');
                this.descriptionContainer.classList.toggle('hide-Item');

                let pokemonId = parseInt(item.dataset.pokemonId);
                [this.nextBtn, this.prevBtn].forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (btn.classList.value === 'btn-prev') {
                            pokemonId = (pokemonId === 1) ? 100 : (pokemonId - 1) % 101;
                        } else {
                            pokemonId = (pokemonId === 100) ? 1 : (pokemonId + 1) % 101;
                        }
                        item = this.pokemonItems.querySelector(`[data-pokemon-id='${pokemonId}']`);
                        this.showDetailsLayout(item);
                    });
                });

                this.showDetailsLayout(item);
            });
        });
    }

    displayPokemonItems() {
        const pokemonItems = [];
        for (let index = 1; index <= 100; index++) {
            let POKEMON_URL = `https://pokeapi.co/api/v2/pokemon/${index}`;
            pokemonItems.push(fetch(POKEMON_URL).then(res => {
                document.querySelector('.loader').classList.remove('hide-Item');
                return res.json();
            }));
        }

        Promise.all(pokemonItems)
            .then(results => {
                document.querySelector('.loader').classList.add('hide-Item');
                results.map(result => {
                    let randomNumber = Math.floor(Math.random() * (20 - 1 + 1)) + 1;
                    let compHTML = `
                    <div class="pokemon-item pokemon_${result.id}" 
                        style="background-color: ${this.colorsMap[randomNumber][1]}" 
                        data-pokemon-id="${result.id}" 
                        data-pokemon-name="${result.name}">
                            <img src="${result.sprites['front_default']}" alt="${result.name}">
                            <p class="pokemon-name bold-text">${result.name}</p>
                            <p class="pokemon-id">${result.id}</p>
                    </div>
                `;
                    this.pokemonItems.innerHTML += compHTML;
                });
                this.handleOpenCloseModal();
            });
    }

    searchItemByName(e) {
        const searchStr = e.target.value.toLowerCase();
        const items = [...this.pokemonItems.children];
        if (searchStr === '') {
            items.forEach(item => item.classList.remove('hide-Item'));
            return;
        }

        items.forEach(pokemonItem => {
            this.matchPokemonName(pokemonItem, searchStr);
        });
    }

    matchPokemonName(pokemonItem, searchStr) {
        let pokemonName = pokemonItem.querySelector('.pokemon-name').innerHTML.toLowerCase();

        if (searchStr.length > pokemonItem.length) {
            return;
        }

        let i = 0, j = 0, n = pokemonName.length, m = searchStr.length, flag = 0;
        while (i < n && j < m) {
            if (pokemonName.charAt(i) === searchStr.charAt(j)) {
                flag++, j++, i++;
            } else {
                i++;
            }
            if (flag == m) {
                pokemonItem.classList.remove('hide-Item');
                return;
            }
        }
        pokemonItem.classList.add('hide-Item');
    }

    showDetailsLayout(pokemonItem) {
        let pokemonId = parseInt(pokemonItem.dataset.pokemonId);
        const pokemonName = pokemonItem.querySelector('.pokemon-name').innerHTML;

        const POKEMON_URL = `https://pokeapi.co/api/v2/pokemon/${pokemonId}`;
        const POKEMOM_GENDER = `https://pokeapi.co/api/v2/gender/?name=${pokemonName}`;
        const EGG_GROUP = `https://pokeapi.co/api/v2/egg-group/?name=${pokemonName}`;
        const POKEMON_SPECIES = `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`;

        const request1 = fetch(POKEMON_URL).then(res => res.json());
        const request2 = fetch(POKEMOM_GENDER).then(res => res.json());
        const request3 = fetch(POKEMON_SPECIES).then(res => res.json());
        document.querySelector('.loader').classList.remove('hide-Item');

        Promise.all([request1, request2, request3])
            .then(([data1, data2, data3]) => {
                document.querySelector('.loader').classList.add('hide-Item');
                const EVOLUTION_URL = data3.evolution_chain.url;
                let jsonObj = {
                    name: pokemonName,
                    id: pokemonId,
                    image: data1.sprites['front_default'],
                    height: data1.height,
                    weight: data1.weight,
                    abilities: data1.abilities.slice(0, 2),
                    types: data1.types.slice(0, 2),
                    gender: [...data2.results],
                    eggGroups: data3.egg_groups.slice(0, 2),
                    stats: [...data1.stats],
                    evolutionChain: fetch(EVOLUTION_URL).then(res => res.json())
                };
                this.displaySelectedPokemon(jsonObj);
            })
            .catch(error => {
                console.error(error);
            });
    }

    displaySelectedPokemon(response) {
        let imageContainer = this.descriptionContainer.querySelector('.img-container');
        let pokemonImage = this.descriptionContainer.querySelector('.img-container img');
        let pokemonName = this.descriptionContainer.querySelector('.pokemon-name-selected');
        let pokemonID = this.descriptionContainer.querySelector('.pokemon-id-selected');
        let pokemonAttributes = this.descriptionContainer.querySelector('.pokemon-attributes');
        let pokemonStats = this.descriptionContainer.querySelector('.pokemon-stats ul');

        pokemonImage.src = response.image;
        imageContainer.style.backgroundColor = `${this.colorsMap[Math.floor(Math.random() * (20 - 1 + 1)) + 1][1]}`;
        pokemonName.innerHTML = response.name;
        pokemonID.innerHTML = response.id;

        let genderHTML = '';
        response.gender.forEach(item => {
            genderHTML += item.name + ',';
        });
        genderHTML = genderHTML.slice(0, -1);

        let eggGroupsHTML = '';
        response.eggGroups.forEach(egg => {
            eggGroupsHTML += egg.name + ',';
        });
        eggGroupsHTML = eggGroupsHTML.slice(0, -1);

        let abilitiesHTML = '';
        response.abilities.forEach(ability => {
            abilitiesHTML += ability.ability.name + ',';
        });
        abilitiesHTML = abilitiesHTML.slice(0, -1);

        let typesHTML = '';
        response.types.forEach(type => {
            typesHTML += type.type.name + ',';
        });
        typesHTML = typesHTML.slice(0, -1);

        let attributesHTML = `
            <div class="attribute-container">
            <strong>Height</strong>
            <p>${response.height}</p>
            </div>
            <div class="attribute-container">
                <strong>Weight</strong>
                <p>${response.weight}kg</p>
            </div>
            <div class="attribute-container">
                <strong>Gender(s)</strong>
                <p>${genderHTML}</p>
            </div>
            <div class="attribute-container">
                <strong>Egg Groups</strong>
                <p>${eggGroupsHTML}</p>
            </div>
            <div class="attribute-container">
                <strong>Abilities</strong>
                <p>${abilitiesHTML}</p>
            </div>
            <div class="attribute-container">
                <strong>Types</strong>
                <p>${typesHTML}</p>
            </div>
            <div class="attribute-container">
                <strong>Weak Against</strong>
                <p>Fighting,Ground,Steel,Water,Grass</p>
            </div>
        `;
        pokemonAttributes.innerHTML = attributesHTML;


        let statsHTML = '';
        response.stats.forEach(item => {
            let currHTML = `
                <li>
                    <p class="stats-name">${item.stat.name.toUpperCase()}</p>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${(item.base_stat > 100) ? 100 : item.base_stat}%">${item.base_stat}</div>
                    </div>
                </li>
            `;
            statsHTML += currHTML;
        });
        pokemonStats.innerHTML = statsHTML;

        response.evolutionChain.then(res => {
            let evolutionChainObj = [];
            let chain = res.chain;
            evolutionChainObj.push(chain.species.name);
            if (chain.evolves_to[0]) {
                evolutionChainObj.push(chain.evolves_to[0].species.name);
                if (chain.evolves_to[0].evolves_to[0]) {
                    evolutionChainObj.push(chain.evolves_to[0].evolves_to[0].species.name);
                }
            }

            let evolHTML = ``;
            for (let i = 0; i < evolutionChainObj.length; i++) {
                const currEle = this.pokemonItems.querySelector(`[data-pokemon-name="${evolutionChainObj[i]}"]`);
                let imgURL = currEle.querySelector('img').src;
                let currID = currEle.dataset.pokemonId;
                let evolutionItemHTML = `
                <div class="evolution-item">
                    <img class="evolution-img" src="${imgURL}" alt="">
                    <h2>${evolutionChainObj[i]}</h2>
                    <p>${currID}</p>
                </div>
                `;
                let iconRightHTML = `<div class="icon-right"><img src="./Icons/icon_arrow_long_right.svg" alt=""></div>`;
                evolHTML += evolutionItemHTML;
                evolHTML += (i === evolutionChainObj.length - 1) ? '' : iconRightHTML;
            }
            this.evolutionContainer.innerHTML = evolHTML;
        });
    }

    setRootColorValues() {
        const root = document.querySelector(':root');
        const size = Object.keys(COLORS).length;
        for (let i = 0; i < size; i++) {
            const key = Object.keys(COLORS)[i];
            const value = COLORS[key];

            root.style.setProperty(`--${key}`, value);
            this.colorsMap[i + 1] = [key, value];
        }
    }
}

window.addEventListener('DOMContentLoaded', () => new PokemonComponent());