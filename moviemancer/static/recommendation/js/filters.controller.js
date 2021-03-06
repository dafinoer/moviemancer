var app = angular.module('filtersApp', ['ngRateIt', 'rzModule']).config(function ($interpolateProvider) {
    $interpolateProvider.startSymbol('{$');
    $interpolateProvider.endSymbol('$}');
});

app.controller('filtersCtrl', ['$scope', '$http', '$routeParams', '$window', '$rootScope', '$location', 'MoviemancerService', function ($scope, $http, $routeParams, $window, $rootScope, $location, MoviemancerService) {


    $scope.noResults = false;
    $scope.isLoading = false;

   //--------------------------------------------Filter Box Handlers--------------------------------------------
	$scope.filterVisible = false;
	$scope.toggle = true;

	$scope.yearSlider = {
		minValue: 1920,
		maxValue: 2017,
		options: {
			floor: 1920,
			ceil: 2017,
		}
	};

	$scope.runtimeSlider = {
		minValue: 50,
		maxValue: 300,
		options: {
			floor: 50,
			ceil: 300,
		}
	};

	$scope.genresSelector = MoviemancerService.getGenres();
	$scope.languages = MoviemancerService.getLanguages();

	$scope.selectPT = function () {
		$scope.languages = MoviemancerService.selectPT($scope.languages);
	}

	$scope.selectEN = function () {
		$scope.languages = MoviemancerService.selectEN($scope.languages);
	}

	$scope.selectDE = function () {
		$scope.languages = MoviemancerService.selectDE($scope.languages);
	}

	$scope.selectIT = function () {
		$scope.languages = MoviemancerService.selectIT($scope.languages);
	}

	$scope.selectJA = function () {
		$scope.languages = MoviemancerService.selectJA($scope.languages);
	}

	$scope.selectFR = function () {
		$scope.languages = MoviemancerService.selectFR($scope.languages);
	}

	$scope.selectGenre = function (id, index) {
		$scope.genresSelector = MoviemancerService.selectGenre(id, index, $scope.genresSelector);
	}

	$scope.showFilterBar = function () {
		$scope.filterVisible = !$scope.filterVisible;
		$scope.toggle = !$scope.toggle;
	},
	//--------------------------------------------Filter Request Handlers--------------------------------------------

	$scope.handleFilters = function (genres, yearMin, yearMax, runtimeMin, runtimeMax, languages, discover, recommendation) {
		MoviemancerService.handleFilters (genres, yearMin, yearMax, runtimeMin, runtimeMax, languages, discover, recommendation);
	}

    //--------------------------------------------Get Filters Result Handlers--------------------------------------------

    $scope.formatRating = function(r){
		r = parseInt(r);
		if (r < 3) {
			$scope.rating = 1;
		}else if (r < 5) {
			$scope.rating = 2;
		}else if (r < 7) {
			$scope.rating = 3;
		}else if (r < 9) {
			$scope.rating = 4;
		}else {
			$scope.rating = 5;
		}

		return $scope.rating;
	}

    $scope.getFilterResult = function () {
        $scope.isLoading = true
        $scope.baseUrl = 'https://api.themoviedb.org/3/discover/movie?api_key=5880f597a9fab4f284178ffe0e1f0dba';
        $scope.baseParams = '&language=pt-BR&release_date.gte=' + $routeParams.yearMin +
            '&release_date.lte=' + $routeParams.yearMax + '&with_runtime.gte=' +
            $routeParams.runtimeMin + '&with_runtime.lte=' + $routeParams.runtimeMax;

        $scope.params = '';

        if ($routeParams.genres == 'null' && $routeParams.language == 'null') {
            $scope.params = $scope.baseParams;

        } else if ($routeParams.genres == 'null') {
            $scope.params = $scope.baseParams + '&with_original_language=' + $routeParams.language;
        } else if ($routeParams.language == 'null') {
            $scope.params = $scope.baseParams + '&with_genres=' + $routeParams.genres;
        } else {
            $scope.params = $scope.baseParams + '&with_genres=' + $routeParams.genres + '&with_original_language=' + $routeParams.language;
        }

        $scope.requestUrl = $scope.baseUrl + $scope.params;

        $scope.getList = $http.get($scope.requestUrl);

        $scope.getList.then(
            function (payload) {
                $scope.fullList = [];
                $scope.index = [];

                if(payload.data.results.length < 1) {
                    $scope.noResults = true;
                }

                for (i = 0; i < payload.data.results.length; i++) {
                    $scope.fullList.push({
                        title: payload.data.results[i].title,
                        poster: 'https://image.tmdb.org/t/p/original/' + payload.data.results[i].poster_path,
                        tmdb_id: payload.data.results[i].id,
                        rating: $scope.formatRating(payload.data.results[i].vote_average)
                    });
                }
                $scope.chunk_size = 6;
                $scope.filteredList = $scope.fullList.map(function (e, i) {
                    return i % $scope.chunk_size === 0 ? $scope.fullList.slice(i, i + $scope.chunk_size) : null;
                })
                    .filter(function (e) { return e; });

                for (i = 0; i < $scope.filteredList.length; i++) {
                    $scope.index.push(i);
                }

                $scope.isLoading = false
            });
    }

    $scope.getFilterResultByRecommendation = function () {
        $scope.isLoading = true;
         if ($routeParams.genres == 'null') {
            $routeParams.genres = 0
         }

         if ($routeParams.language == 'null') {
            $routeParams.language = 0
         }

		$http.post("filterreco/", {
			"user_id": $rootScope.globals.currentUser.user_id,
            "minYear": new Date($routeParams.yearMin).getFullYear(),
            "maxYear": new Date($routeParams.yearMax).getFullYear(),
            "minRuntime": parseInt($routeParams.runtimeMin),
            "maxRuntime": parseInt($routeParams.runtimeMax),
            "genres": $routeParams.genres,
            "language": $routeParams.language
		}, {
				'Content-Type': 'application/json; charset=utf-8'
			})
			.then(
			function (response) {
				$scope.fullList = [];
				$scope.index = [];

                 if(response.data.length < 1) {
                    $scope.noResults = true;
                }

				for (i = 0; i < response.data.length; i++) {
					$scope.fullList.push({
						title: response.data[i].tmdb_title,
						poster: response.data[i].tmdb_poster,
						movie_id: response.data[i].movie_id,
						tmdb_id: response.data[i].tmdb_movie_id,
						rating: response.data[i].tmdb_rating
					});
				}

				$scope.chunk_size = 6;
				$scope.filteredList = $scope.fullList.map(function (e, i) {
					return i % $scope.chunk_size === 0 ? $scope.fullList.slice(i, i + $scope.chunk_size) : null;
				})
					.filter(function (e) { return e; });

				for (i = 0; i < $scope.filteredList.length; i++) {
					$scope.index.push(i);
				}

                $scope.isLoading = false
			},
			function (response) {
				console.log('Error: ', response)
			});


	}

    if($routeParams.discover == 'true') {
        $scope.currentScope = 'Descoberta';
        $scope.getFilterResult();
    }

    if($routeParams.recommendation == 'true') {
        $scope.currentScope = 'Recomendação'
        $scope.getFilterResultByRecommendation();
    }

    $scope.getSelectedGenres = function () {
        $scope.genresSelector = MoviemancerService.getGenres();;
        if ($routeParams.genres == 'null' || $routeParams.genres == 0) {
            return ('Não Selecionado')
        } else {
            $scope.lgenres = [];
            $scope.rawGenres = $routeParams.genres.split(',');

            for (i = 0; i < $scope.rawGenres.length; i++) {
                for (k = 0; k < $scope.genresSelector.length; k++) {
                    if ($scope.genresSelector[k].id == $scope.rawGenres[i]) {
                        $scope.lgenres.push($scope.genresSelector[k].name)
                    }
                }
            }

            return ($scope.lgenres.join(", "));
        }

    }

    $scope.getSelectedLanguage = function () {
        if ($routeParams.language == 'pt') {
            $scope.lng = 'Português';
        }
        if ($routeParams.language == 'en') {
            $scope.lng = 'Inglês';
        }
        if ($routeParams.language == 'de') {
            $scope.lng = 'Alemão';
        }
        if ($routeParams.language == 'it') {
            $scope.lng = 'Italiano';
        }
        if ($routeParams.language == 'ja') {
            $scope.lng = 'Japonês';
        }
        if ($routeParams.language == 'fr') {
            $scope.lng = 'Francês';
        }

        if ($routeParams.language == 'null' || $routeParams.language == 0) {
            $scope.lng = 'Não Selecionado';
        }

        return ($scope.lng);
    }

    $scope.getSelectedFilters = function () {
        $scope.currentGenres = $scope.getSelectedGenres();
        $scope.currentLanguage = $scope.getSelectedLanguage();
        $scope.currentMinRuntime = $routeParams.runtimeMin + 'min';
        $scope.currentMaxRuntime = $routeParams.runtimeMax + 'min';
        $scope.currentMinYear = $routeParams.yearMin.split('-');
        $scope.currentMinYear = $scope.currentMinYear[0];
        $scope.currentMaxYear = $routeParams.yearMax.split('-');
        $scope.currentMaxYear = $scope.currentMaxYear[0];
    }

    $scope.getSelectedFilters();

    //--------------------------------------------Rating Handler--------------------------------------------

    $scope.setUserRatingExternal = function (rating, poster, title, id) {
		MoviemancerService.setUserRatingExternal(rating, poster, title, id, $rootScope.globals.currentUser.user_id, function (response) {
            if (response.status == 200) {
				console.log('Success: ', response.data)
				$scope.toastMessege("Filme Adicionado a Lista de Vistos")
            } else {
                $scope.toastMessege("Erro ao Classificar Filme")
            }
        });
	}

    $scope.setUserRating = function (rating, movieID) {
		MoviemancerService.setUserRating(rating, movieID, $rootScope.globals.currentUser.user_id, function (response) {
            if (response.status == 200) {
				console.log('Success: ', response.data)
				$scope.toastMessege("Filme Adicionado a Lista de Vistos")
            } else {
                $scope.toastMessege("Erro ao Classificar Filme")
            }
        });
	}

    //--------------------------------------------Add to watchlist Handler--------------------------------------------

    $scope.addWatchlistExternal = function (tmdb_id, poster, title) {

		MoviemancerService.addWatchlistExternal(tmdb_id, poster, title, $rootScope.globals.currentUser.user_id, function (response) {
            if (response.status == 200) {
                console.log('Success: ', response.data)
				$scope.toastMessege("Filme Adicionado a Quero Ver")
            } else {
                $scope.toastMessege("Erro ao Adicionar a Watchlist")
            }
        });
	}

    //--------------------------------------------Search--------------------------------------------
	$scope.searchMovie = function (query) {
		$location.path('/search/' + query);
	}

    //--------------------------------------------Toast Message Handler--------------------------------------------
    $scope.toastMessege = function (msg) {
        $scope.toastMessage = msg;
        // Get the snackbar DIV
        var x = document.getElementById("snackbar")

        // Add the "show" class to DIV
        x.className = "show";

        // After 3 seconds, remove the show class from DIV
        setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
    }
}]);