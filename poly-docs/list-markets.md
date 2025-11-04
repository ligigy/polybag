# List markets

## OpenAPI

````yaml api-reference/gamma-openapi.json get /markets
paths:
  path: /markets
  method: get
  servers:
    - url: https://gamma-api.polymarket.com
      description: Polymarket Gamma API Production Server
  request:
    security: []
    parameters:
      path: {}
      query:
        limit:
          schema:
            - type: integer
              minimum: 0
        offset:
          schema:
            - type: integer
              minimum: 0
        order:
          schema:
            - type: string
              description: Comma-separated list of fields to order by
        ascending:
          schema:
            - type: boolean
        id:
          schema:
            - type: array
              items:
                allOf:
                  - type: integer
        slug:
          schema:
            - type: array
              items:
                allOf:
                  - type: string
        clob_token_ids:
          schema:
            - type: array
              items:
                allOf:
                  - type: string
        condition_ids:
          schema:
            - type: array
              items:
                allOf:
                  - type: string
        market_maker_address:
          schema:
            - type: array
              items:
                allOf:
                  - type: string
        liquidity_num_min:
          schema:
            - type: number
        liquidity_num_max:
          schema:
            - type: number
        volume_num_min:
          schema:
            - type: number
        volume_num_max:
          schema:
            - type: number
        start_date_min:
          schema:
            - type: string
              format: date-time
        start_date_max:
          schema:
            - type: string
              format: date-time
        end_date_min:
          schema:
            - type: string
              format: date-time
        end_date_max:
          schema:
            - type: string
              format: date-time
        tag_id:
          schema:
            - type: integer
        related_tags:
          schema:
            - type: boolean
        cyom:
          schema:
            - type: boolean
        uma_resolution_status:
          schema:
            - type: string
        game_id:
          schema:
            - type: string
        sports_market_types:
          schema:
            - type: array
              items:
                allOf:
                  - type: string
        rewards_min_size:
          schema:
            - type: number
        question_ids:
          schema:
            - type: array
              items:
                allOf:
                  - type: string
        include_tag:
          schema:
            - type: boolean
        closed:
          schema:
            - type: boolean
      header: {}
      cookie: {}
    body: {}
  response:
    '200':
      application/json:
        schemaArray:
          - type: array
            items:
              allOf:
                - $ref: '#/components/schemas/Market'
        examples:
          example:
            value:
              - id: <string>
                question: <string>
                conditionId: <string>
                slug: <string>
                twitterCardImage: <string>
                resolutionSource: <string>
                endDate: '2023-11-07T05:31:56Z'
                category: <string>
                ammType: <string>
                liquidity: <string>
                sponsorName: <string>
                sponsorImage: <string>
                startDate: '2023-11-07T05:31:56Z'
                xAxisValue: <string>
                yAxisValue: <string>
                denominationToken: <string>
                fee: <string>
                image: <string>
                icon: <string>
                lowerBound: <string>
                upperBound: <string>
                description: <string>
                outcomes: <string>
                outcomePrices: <string>
                volume: <string>
                active: true
                marketType: <string>
                formatType: <string>
                lowerBoundDate: <string>
                upperBoundDate: <string>
                closed: true
                marketMakerAddress: <string>
                createdBy: 123
                updatedBy: 123
                createdAt: '2023-11-07T05:31:56Z'
                updatedAt: '2023-11-07T05:31:56Z'
                closedTime: <string>
                wideFormat: true
                new: true
                mailchimpTag: <string>
                featured: true
                archived: true
                resolvedBy: <string>
                restricted: true
                marketGroup: 123
                groupItemTitle: <string>
                groupItemThreshold: <string>
                questionID: <string>
                umaEndDate: <string>
                enableOrderBook: true
                orderPriceMinTickSize: 123
                orderMinSize: 123
                umaResolutionStatus: <string>
                curationOrder: 123
                volumeNum: 123
                liquidityNum: 123
                endDateIso: <string>
                startDateIso: <string>
                umaEndDateIso: <string>
                hasReviewedDates: true
                readyForCron: true
                commentsEnabled: true
                volume24hr: 123
                volume1wk: 123
                volume1mo: 123
                volume1yr: 123
                gameStartTime: <string>
                secondsDelay: 123
                clobTokenIds: <string>
                disqusThread: <string>
                shortOutcomes: <string>
                teamAID: <string>
                teamBID: <string>
                umaBond: <string>
                umaReward: <string>
                fpmmLive: true
                volume24hrAmm: 123
                volume1wkAmm: 123
                volume1moAmm: 123
                volume1yrAmm: 123
                volume24hrClob: 123
                volume1wkClob: 123
                volume1moClob: 123
                volume1yrClob: 123
                volumeAmm: 123
                volumeClob: 123
                liquidityAmm: 123
                liquidityClob: 123
                makerBaseFee: 123
                takerBaseFee: 123
                customLiveness: 123
                acceptingOrders: true
                notificationsEnabled: true
                score: 123
                imageOptimized:
                  id: <string>
                  imageUrlSource: <string>
                  imageUrlOptimized: <string>
                  imageSizeKbSource: 123
                  imageSizeKbOptimized: 123
                  imageOptimizedComplete: true
                  imageOptimizedLastUpdated: <string>
                  relID: 123
                  field: <string>
                  relname: <string>
                iconOptimized:
                  id: <string>
                  imageUrlSource: <string>
                  imageUrlOptimized: <string>
                  imageSizeKbSource: 123
                  imageSizeKbOptimized: 123
                  imageOptimizedComplete: true
                  imageOptimizedLastUpdated: <string>
                  relID: 123
                  field: <string>
                  relname: <string>
                events:
                  - id: <string>
                    ticker: <string>
                    slug: <string>
                    title: <string>
                    subtitle: <string>
                    description: <string>
                    resolutionSource: <string>
                    startDate: '2023-11-07T05:31:56Z'
                    creationDate: '2023-11-07T05:31:56Z'
                    endDate: '2023-11-07T05:31:56Z'
                    image: <string>
                    icon: <string>
                    active: true
                    closed: true
                    archived: true
                    new: true
                    featured: true
                    restricted: true
                    liquidity: 123
                    volume: 123
                    openInterest: 123
                    sortBy: <string>
                    category: <string>
                    subcategory: <string>
                    isTemplate: true
                    templateVariables: <string>
                    published_at: <string>
                    createdBy: <string>
                    updatedBy: <string>
                    createdAt: '2023-11-07T05:31:56Z'
                    updatedAt: '2023-11-07T05:31:56Z'
                    commentsEnabled: true
                    competitive: 123
                    volume24hr: 123
                    volume1wk: 123
                    volume1mo: 123
                    volume1yr: 123
                    featuredImage: <string>
                    disqusThread: <string>
                    parentEvent: <string>
                    enableOrderBook: true
                    liquidityAmm: 123
                    liquidityClob: 123
                    negRisk: true
                    negRiskMarketID: <string>
                    negRiskFeeBips: 123
                    commentCount: 123
                    imageOptimized:
                      id: <string>
                      imageUrlSource: <string>
                      imageUrlOptimized: <string>
                      imageSizeKbSource: 123
                      imageSizeKbOptimized: 123
                      imageOptimizedComplete: true
                      imageOptimizedLastUpdated: <string>
                      relID: 123
                      field: <string>
                      relname: <string>
                    iconOptimized:
                      id: <string>
                      imageUrlSource: <string>
                      imageUrlOptimized: <string>
                      imageSizeKbSource: 123
                      imageSizeKbOptimized: 123
                      imageOptimizedComplete: true
                      imageOptimizedLastUpdated: <string>
                      relID: 123
                      field: <string>
                      relname: <string>
                    featuredImageOptimized:
                      id: <string>
                      imageUrlSource: <string>
                      imageUrlOptimized: <string>
                      imageSizeKbSource: 123
                      imageSizeKbOptimized: 123
                      imageOptimizedComplete: true
                      imageOptimizedLastUpdated: <string>
                      relID: 123
                      field: <string>
                      relname: <string>
                    subEvents:
                      - <string>
                    markets:
                      - {}
                    series:
                      - id: <string>
                        ticker: <string>
                        slug: <string>
                        title: <string>
                        subtitle: <string>
                        seriesType: <string>
                        recurrence: <string>
                        description: <string>
                        image: <string>
                        icon: <string>
                        layout: <string>
                        active: true
                        closed: true
                        archived: true
                        new: true
                        featured: true
                        restricted: true
                        isTemplate: true
                        templateVariables: true
                        publishedAt: <string>
                        createdBy: <string>
                        updatedBy: <string>
                        createdAt: '2023-11-07T05:31:56Z'
                        updatedAt: '2023-11-07T05:31:56Z'
                        commentsEnabled: true
                        competitive: <string>
                        volume24hr: 123
                        volume: 123
                        liquidity: 123
                        startDate: '2023-11-07T05:31:56Z'
                        pythTokenID: <string>
                        cgAssetName: <string>
                        score: 123
                        events:
                          - {}
                        collections:
                          - id: <string>
                            ticker: <string>
                            slug: <string>
                            title: <string>
                            subtitle: <string>
                            collectionType: <string>
                            description: <string>
                            tags: <string>
                            image: <string>
                            icon: <string>
                            headerImage: <string>
                            layout: <string>
                            active: true
                            closed: true
                            archived: true
                            new: true
                            featured: true
                            restricted: true
                            isTemplate: true
                            templateVariables: <string>
                            publishedAt: <string>
                            createdBy: <string>
                            updatedBy: <string>
                            createdAt: '2023-11-07T05:31:56Z'
                            updatedAt: '2023-11-07T05:31:56Z'
                            commentsEnabled: true
                            imageOptimized:
                              id: <string>
                              imageUrlSource: <string>
                              imageUrlOptimized: <string>
                              imageSizeKbSource: 123
                              imageSizeKbOptimized: 123
                              imageOptimizedComplete: true
                              imageOptimizedLastUpdated: <string>
                              relID: 123
                              field: <string>
                              relname: <string>
                            iconOptimized:
                              id: <string>
                              imageUrlSource: <string>
                              imageUrlOptimized: <string>
                              imageSizeKbSource: 123
                              imageSizeKbOptimized: 123
                              imageOptimizedComplete: true
                              imageOptimizedLastUpdated: <string>
                              relID: 123
                              field: <string>
                              relname: <string>
                            headerImageOptimized:
                              id: <string>
                              imageUrlSource: <string>
                              imageUrlOptimized: <string>
                              imageSizeKbSource: 123
                              imageSizeKbOptimized: 123
                              imageOptimizedComplete: true
                              imageOptimizedLastUpdated: <string>
                              relID: 123
                              field: <string>
                              relname: <string>
                        categories:
                          - id: <string>
                            label: <string>
                            parentCategory: <string>
                            slug: <string>
                            publishedAt: <string>
                            createdBy: <string>
                            updatedBy: <string>
                            createdAt: '2023-11-07T05:31:56Z'
                            updatedAt: '2023-11-07T05:31:56Z'
                        tags:
                          - id: <string>
                            label: <string>
                            slug: <string>
                            forceShow: true
                            publishedAt: <string>
                            createdBy: 123
                            updatedBy: 123
                            createdAt: '2023-11-07T05:31:56Z'
                            updatedAt: '2023-11-07T05:31:56Z'
                            forceHide: true
                            isCarousel: true
                        commentCount: 123
                        chats:
                          - id: <string>
                            channelId: <string>
                            channelName: <string>
                            channelImage: <string>
                            live: true
                            startTime: '2023-11-07T05:31:56Z'
                            endTime: '2023-11-07T05:31:56Z'
                    categories:
                      - id: <string>
                        label: <string>
                        parentCategory: <string>
                        slug: <string>
                        publishedAt: <string>
                        createdBy: <string>
                        updatedBy: <string>
                        createdAt: '2023-11-07T05:31:56Z'
                        updatedAt: '2023-11-07T05:31:56Z'
                    collections:
                      - id: <string>
                        ticker: <string>
                        slug: <string>
                        title: <string>
                        subtitle: <string>
                        collectionType: <string>
                        description: <string>
                        tags: <string>
                        image: <string>
                        icon: <string>
                        headerImage: <string>
                        layout: <string>
                        active: true
                        closed: true
                        archived: true
                        new: true
                        featured: true
                        restricted: true
                        isTemplate: true
                        templateVariables: <string>
                        publishedAt: <string>
                        createdBy: <string>
                        updatedBy: <string>
                        createdAt: '2023-11-07T05:31:56Z'
                        updatedAt: '2023-11-07T05:31:56Z'
                        commentsEnabled: true
                        imageOptimized:
                          id: <string>
                          imageUrlSource: <string>
                          imageUrlOptimized: <string>
                          imageSizeKbSource: 123
                          imageSizeKbOptimized: 123
                          imageOptimizedComplete: true
                          imageOptimizedLastUpdated: <string>
                          relID: 123
                          field: <string>
                          relname: <string>
                        iconOptimized:
                          id: <string>
                          imageUrlSource: <string>
                          imageUrlOptimized: <string>
                          imageSizeKbSource: 123
                          imageSizeKbOptimized: 123
                          imageOptimizedComplete: true
                          imageOptimizedLastUpdated: <string>
                          relID: 123
                          field: <string>
                          relname: <string>
                        headerImageOptimized:
                          id: <string>
                          imageUrlSource: <string>
                          imageUrlOptimized: <string>
                          imageSizeKbSource: 123
                          imageSizeKbOptimized: 123
                          imageOptimizedComplete: true
                          imageOptimizedLastUpdated: <string>
                          relID: 123
                          field: <string>
                          relname: <string>
                    tags:
                      - id: <string>
                        label: <string>
                        slug: <string>
                        forceShow: true
                        publishedAt: <string>
                        createdBy: 123
                        updatedBy: 123
                        createdAt: '2023-11-07T05:31:56Z'
                        updatedAt: '2023-11-07T05:31:56Z'
                        forceHide: true
                        isCarousel: true
                    cyom: true
                    closedTime: '2023-11-07T05:31:56Z'
                    showAllOutcomes: true
                    showMarketImages: true
                    automaticallyResolved: true
                    enableNegRisk: true
                    automaticallyActive: true
                    eventDate: <string>
                    startTime: '2023-11-07T05:31:56Z'
                    eventWeek: 123
                    seriesSlug: <string>
                    score: <string>
                    elapsed: <string>
                    period: <string>
                    live: true
                    ended: true
                    finishedTimestamp: '2023-11-07T05:31:56Z'
                    gmpChartMode: <string>
                    eventCreators:
                      - id: <string>
                        creatorName: <string>
                        creatorHandle: <string>
                        creatorUrl: <string>
                        creatorImage: <string>
                        createdAt: '2023-11-07T05:31:56Z'
                        updatedAt: '2023-11-07T05:31:56Z'
                    tweetCount: 123
                    chats:
                      - id: <string>
                        channelId: <string>
                        channelName: <string>
                        channelImage: <string>
                        live: true
                        startTime: '2023-11-07T05:31:56Z'
                        endTime: '2023-11-07T05:31:56Z'
                    featuredOrder: 123
                    estimateValue: true
                    cantEstimate: true
                    estimatedValue: <string>
                    templates:
                      - id: <string>
                        eventTitle: <string>
                        eventSlug: <string>
                        eventImage: <string>
                        marketTitle: <string>
                        description: <string>
                        resolutionSource: <string>
                        negRisk: true
                        sortBy: <string>
                        showMarketImages: true
                        seriesSlug: <string>
                        outcomes: <string>
                    spreadsMainLine: 123
                    totalsMainLine: 123
                    carouselMap: <string>
                    pendingDeployment: true
                    deploying: true
                    deployingTimestamp: '2023-11-07T05:31:56Z'
                    scheduledDeploymentTimestamp: '2023-11-07T05:31:56Z'
                    gameStatus: <string>
                categories:
                  - id: <string>
                    label: <string>
                    parentCategory: <string>
                    slug: <string>
                    publishedAt: <string>
                    createdBy: <string>
                    updatedBy: <string>
                    createdAt: '2023-11-07T05:31:56Z'
                    updatedAt: '2023-11-07T05:31:56Z'
                tags:
                  - id: <string>
                    label: <string>
                    slug: <string>
                    forceShow: true
                    publishedAt: <string>
                    createdBy: 123
                    updatedBy: 123
                    createdAt: '2023-11-07T05:31:56Z'
                    updatedAt: '2023-11-07T05:31:56Z'
                    forceHide: true
                    isCarousel: true
                creator: <string>
                ready: true
                funded: true
                pastSlugs: <string>
                readyTimestamp: '2023-11-07T05:31:56Z'
                fundedTimestamp: '2023-11-07T05:31:56Z'
                acceptingOrdersTimestamp: '2023-11-07T05:31:56Z'
                competitive: 123
                rewardsMinSize: 123
                rewardsMaxSpread: 123
                spread: 123
                automaticallyResolved: true
                oneDayPriceChange: 123
                oneHourPriceChange: 123
                oneWeekPriceChange: 123
                oneMonthPriceChange: 123
                oneYearPriceChange: 123
                lastTradePrice: 123
                bestBid: 123
                bestAsk: 123
                automaticallyActive: true
                clearBookOnStart: true
                chartColor: <string>
                seriesColor: <string>
                showGmpSeries: true
                showGmpOutcome: true
                manualActivation: true
                negRiskOther: true
                gameId: <string>
                groupItemRange: <string>
                sportsMarketType: <string>
                line: 123
                umaResolutionStatuses: <string>
                pendingDeployment: true
                deploying: true
                deployingTimestamp: '2023-11-07T05:31:56Z'
                scheduledDeploymentTimestamp: '2023-11-07T05:31:56Z'
                rfqEnabled: true
                eventStartTime: '2023-11-07T05:31:56Z'
        description: List of markets
  deprecated: false
  type: path
components:
  schemas:
    ImageOptimization:
      type: object
      properties:
        id:
          type: string
        imageUrlSource:
          type: string
          nullable: true
        imageUrlOptimized:
          type: string
          nullable: true
        imageSizeKbSource:
          type: number
          nullable: true
        imageSizeKbOptimized:
          type: number
          nullable: true
        imageOptimizedComplete:
          type: boolean
          nullable: true
        imageOptimizedLastUpdated:
          type: string
          nullable: true
        relID:
          type: integer
          nullable: true
        field:
          type: string
          nullable: true
        relname:
          type: string
          nullable: true
    Tag:
      type: object
      properties:
        id:
          type: string
        label:
          type: string
          nullable: true
        slug:
          type: string
          nullable: true
        forceShow:
          type: boolean
          nullable: true
        publishedAt:
          type: string
          nullable: true
        createdBy:
          type: integer
          nullable: true
        updatedBy:
          type: integer
          nullable: true
        createdAt:
          type: string
          format: date-time
          nullable: true
        updatedAt:
          type: string
          format: date-time
          nullable: true
        forceHide:
          type: boolean
          nullable: true
        isCarousel:
          type: boolean
          nullable: true
    Market:
      type: object
      properties:
        id:
          type: string
        question:
          type: string
          nullable: true
        conditionId:
          type: string
        slug:
          type: string
          nullable: true
        twitterCardImage:
          type: string
          nullable: true
        resolutionSource:
          type: string
          nullable: true
        endDate:
          type: string
          format: date-time
          nullable: true
        category:
          type: string
          nullable: true
        ammType:
          type: string
          nullable: true
        liquidity:
          type: string
          nullable: true
        sponsorName:
          type: string
          nullable: true
        sponsorImage:
          type: string
          nullable: true
        startDate:
          type: string
          format: date-time
          nullable: true
        xAxisValue:
          type: string
          nullable: true
        yAxisValue:
          type: string
          nullable: true
        denominationToken:
          type: string
          nullable: true
        fee:
          type: string
          nullable: true
        image:
          type: string
          nullable: true
        icon:
          type: string
          nullable: true
        lowerBound:
          type: string
          nullable: true
        upperBound:
          type: string
          nullable: true
        description:
          type: string
          nullable: true
        outcomes:
          type: string
          nullable: true
        outcomePrices:
          type: string
          nullable: true
        volume:
          type: string
          nullable: true
        active:
          type: boolean
          nullable: true
        marketType:
          type: string
          nullable: true
        formatType:
          type: string
          nullable: true
        lowerBoundDate:
          type: string
          nullable: true
        upperBoundDate:
          type: string
          nullable: true
        closed:
          type: boolean
          nullable: true
        marketMakerAddress:
          type: string
        createdBy:
          type: integer
          nullable: true
        updatedBy:
          type: integer
          nullable: true
        createdAt:
          type: string
          format: date-time
          nullable: true
        updatedAt:
          type: string
          format: date-time
          nullable: true
        closedTime:
          type: string
          nullable: true
        wideFormat:
          type: boolean
          nullable: true
        new:
          type: boolean
          nullable: true
        mailchimpTag:
          type: string
          nullable: true
        featured:
          type: boolean
          nullable: true
        archived:
          type: boolean
          nullable: true
        resolvedBy:
          type: string
          nullable: true
        restricted:
          type: boolean
          nullable: true
        marketGroup:
          type: integer
          nullable: true
        groupItemTitle:
          type: string
          nullable: true
        groupItemThreshold:
          type: string
          nullable: true
        questionID:
          type: string
          nullable: true
        umaEndDate:
          type: string
          nullable: true
        enableOrderBook:
          type: boolean
          nullable: true
        orderPriceMinTickSize:
          type: number
          nullable: true
        orderMinSize:
          type: number
          nullable: true
        umaResolutionStatus:
          type: string
          nullable: true
        curationOrder:
          type: integer
          nullable: true
        volumeNum:
          type: number
          nullable: true
        liquidityNum:
          type: number
          nullable: true
        endDateIso:
          type: string
          nullable: true
        startDateIso:
          type: string
          nullable: true
        umaEndDateIso:
          type: string
          nullable: true
        hasReviewedDates:
          type: boolean
          nullable: true
        readyForCron:
          type: boolean
          nullable: true
        commentsEnabled:
          type: boolean
          nullable: true
        volume24hr:
          type: number
          nullable: true
        volume1wk:
          type: number
          nullable: true
        volume1mo:
          type: number
          nullable: true
        volume1yr:
          type: number
          nullable: true
        gameStartTime:
          type: string
          nullable: true
        secondsDelay:
          type: integer
          nullable: true
        clobTokenIds:
          type: string
          nullable: true
        disqusThread:
          type: string
          nullable: true
        shortOutcomes:
          type: string
          nullable: true
        teamAID:
          type: string
          nullable: true
        teamBID:
          type: string
          nullable: true
        umaBond:
          type: string
          nullable: true
        umaReward:
          type: string
          nullable: true
        fpmmLive:
          type: boolean
          nullable: true
        volume24hrAmm:
          type: number
          nullable: true
        volume1wkAmm:
          type: number
          nullable: true
        volume1moAmm:
          type: number
          nullable: true
        volume1yrAmm:
          type: number
          nullable: true
        volume24hrClob:
          type: number
          nullable: true
        volume1wkClob:
          type: number
          nullable: true
        volume1moClob:
          type: number
          nullable: true
        volume1yrClob:
          type: number
          nullable: true
        volumeAmm:
          type: number
          nullable: true
        volumeClob:
          type: number
          nullable: true
        liquidityAmm:
          type: number
          nullable: true
        liquidityClob:
          type: number
          nullable: true
        makerBaseFee:
          type: integer
          nullable: true
        takerBaseFee:
          type: integer
          nullable: true
        customLiveness:
          type: integer
          nullable: true
        acceptingOrders:
          type: boolean
          nullable: true
        notificationsEnabled:
          type: boolean
          nullable: true
        score:
          type: integer
          nullable: true
        imageOptimized:
          $ref: '#/components/schemas/ImageOptimization'
        iconOptimized:
          $ref: '#/components/schemas/ImageOptimization'
        events:
          type: array
          items:
            $ref: '#/components/schemas/Event'
        categories:
          type: array
          items:
            $ref: '#/components/schemas/Category'
        tags:
          type: array
          items:
            $ref: '#/components/schemas/Tag'
        creator:
          type: string
          nullable: true
        ready:
          type: boolean
          nullable: true
        funded:
          type: boolean
          nullable: true
        pastSlugs:
          type: string
          nullable: true
        readyTimestamp:
          type: string
          format: date-time
          nullable: true
        fundedTimestamp:
          type: string
          format: date-time
          nullable: true
        acceptingOrdersTimestamp:
          type: string
          format: date-time
          nullable: true
        competitive:
          type: number
          nullable: true
        rewardsMinSize:
          type: number
          nullable: true
        rewardsMaxSpread:
          type: number
          nullable: true
        spread:
          type: number
          nullable: true
        automaticallyResolved:
          type: boolean
          nullable: true
        oneDayPriceChange:
          type: number
          nullable: true
        oneHourPriceChange:
          type: number
          nullable: true
        oneWeekPriceChange:
          type: number
          nullable: true
        oneMonthPriceChange:
          type: number
          nullable: true
        oneYearPriceChange:
          type: number
          nullable: true
        lastTradePrice:
          type: number
          nullable: true
        bestBid:
          type: number
          nullable: true
        bestAsk:
          type: number
          nullable: true
        automaticallyActive:
          type: boolean
          nullable: true
        clearBookOnStart:
          type: boolean
          nullable: true
        chartColor:
          type: string
          nullable: true
        seriesColor:
          type: string
          nullable: true
        showGmpSeries:
          type: boolean
          nullable: true
        showGmpOutcome:
          type: boolean
          nullable: true
        manualActivation:
          type: boolean
          nullable: true
        negRiskOther:
          type: boolean
          nullable: true
        gameId:
          type: string
          nullable: true
        groupItemRange:
          type: string
          nullable: true
        sportsMarketType:
          type: string
          nullable: true
        line:
          type: number
          nullable: true
        umaResolutionStatuses:
          type: string
          nullable: true
        pendingDeployment:
          type: boolean
          nullable: true
        deploying:
          type: boolean
          nullable: true
        deployingTimestamp:
          type: string
          format: date-time
          nullable: true
        scheduledDeploymentTimestamp:
          type: string
          format: date-time
          nullable: true
        rfqEnabled:
          type: boolean
          nullable: true
        eventStartTime:
          type: string
          format: date-time
          nullable: true
    Category:
      type: object
      properties:
        id:
          type: string
        label:
          type: string
          nullable: true
        parentCategory:
          type: string
          nullable: true
        slug:
          type: string
          nullable: true
        publishedAt:
          type: string
          nullable: true
        createdBy:
          type: string
          nullable: true
        updatedBy:
          type: string
          nullable: true
        createdAt:
          type: string
          format: date-time
          nullable: true
        updatedAt:
          type: string
          format: date-time
          nullable: true
    Event:
      type: object
      properties:
        id:
          type: string
        ticker:
          type: string
          nullable: true
        slug:
          type: string
          nullable: true
        title:
          type: string
          nullable: true
        subtitle:
          type: string
          nullable: true
        description:
          type: string
          nullable: true
        resolutionSource:
          type: string
          nullable: true
        startDate:
          type: string
          format: date-time
          nullable: true
        creationDate:
          type: string
          format: date-time
          nullable: true
        endDate:
          type: string
          format: date-time
          nullable: true
        image:
          type: string
          nullable: true
        icon:
          type: string
          nullable: true
        active:
          type: boolean
          nullable: true
        closed:
          type: boolean
          nullable: true
        archived:
          type: boolean
          nullable: true
        new:
          type: boolean
          nullable: true
        featured:
          type: boolean
          nullable: true
        restricted:
          type: boolean
          nullable: true
        liquidity:
          type: number
          nullable: true
        volume:
          type: number
          nullable: true
        openInterest:
          type: number
          nullable: true
        sortBy:
          type: string
          nullable: true
        category:
          type: string
          nullable: true
        subcategory:
          type: string
          nullable: true
        isTemplate:
          type: boolean
          nullable: true
        templateVariables:
          type: string
          nullable: true
        published_at:
          type: string
          nullable: true
        createdBy:
          type: string
          nullable: true
        updatedBy:
          type: string
          nullable: true
        createdAt:
          type: string
          format: date-time
          nullable: true
        updatedAt:
          type: string
          format: date-time
          nullable: true
        commentsEnabled:
          type: boolean
          nullable: true
        competitive:
          type: number
          nullable: true
        volume24hr:
          type: number
          nullable: true
        volume1wk:
          type: number
          nullable: true
        volume1mo:
          type: number
          nullable: true
        volume1yr:
          type: number
          nullable: true
        featuredImage:
          type: string
          nullable: true
        disqusThread:
          type: string
          nullable: true
        parentEvent:
          type: string
          nullable: true
        enableOrderBook:
          type: boolean
          nullable: true
        liquidityAmm:
          type: number
          nullable: true
        liquidityClob:
          type: number
          nullable: true
        negRisk:
          type: boolean
          nullable: true
        negRiskMarketID:
          type: string
          nullable: true
        negRiskFeeBips:
          type: integer
          nullable: true
        commentCount:
          type: integer
          nullable: true
        imageOptimized:
          $ref: '#/components/schemas/ImageOptimization'
        iconOptimized:
          $ref: '#/components/schemas/ImageOptimization'
        featuredImageOptimized:
          $ref: '#/components/schemas/ImageOptimization'
        subEvents:
          type: array
          items:
            type: string
          nullable: true
        markets:
          type: array
          items:
            $ref: '#/components/schemas/Market'
        series:
          type: array
          items:
            $ref: '#/components/schemas/Series'
        categories:
          type: array
          items:
            $ref: '#/components/schemas/Category'
        collections:
          type: array
          items:
            $ref: '#/components/schemas/Collection'
        tags:
          type: array
          items:
            $ref: '#/components/schemas/Tag'
        cyom:
          type: boolean
          nullable: true
        closedTime:
          type: string
          format: date-time
          nullable: true
        showAllOutcomes:
          type: boolean
          nullable: true
        showMarketImages:
          type: boolean
          nullable: true
        automaticallyResolved:
          type: boolean
          nullable: true
        enableNegRisk:
          type: boolean
          nullable: true
        automaticallyActive:
          type: boolean
          nullable: true
        eventDate:
          type: string
          nullable: true
        startTime:
          type: string
          format: date-time
          nullable: true
        eventWeek:
          type: integer
          nullable: true
        seriesSlug:
          type: string
          nullable: true
        score:
          type: string
          nullable: true
        elapsed:
          type: string
          nullable: true
        period:
          type: string
          nullable: true
        live:
          type: boolean
          nullable: true
        ended:
          type: boolean
          nullable: true
        finishedTimestamp:
          type: string
          format: date-time
          nullable: true
        gmpChartMode:
          type: string
          nullable: true
        eventCreators:
          type: array
          items:
            $ref: '#/components/schemas/EventCreator'
        tweetCount:
          type: integer
          nullable: true
        chats:
          type: array
          items:
            $ref: '#/components/schemas/Chat'
        featuredOrder:
          type: integer
          nullable: true
        estimateValue:
          type: boolean
          nullable: true
        cantEstimate:
          type: boolean
          nullable: true
        estimatedValue:
          type: string
          nullable: true
        templates:
          type: array
          items:
            $ref: '#/components/schemas/Template'
        spreadsMainLine:
          type: number
          nullable: true
        totalsMainLine:
          type: number
          nullable: true
        carouselMap:
          type: string
          nullable: true
        pendingDeployment:
          type: boolean
          nullable: true
        deploying:
          type: boolean
          nullable: true
        deployingTimestamp:
          type: string
          format: date-time
          nullable: true
        scheduledDeploymentTimestamp:
          type: string
          format: date-time
          nullable: true
        gameStatus:
          type: string
          nullable: true
    EventCreator:
      type: object
      properties:
        id:
          type: string
        creatorName:
          type: string
          nullable: true
        creatorHandle:
          type: string
          nullable: true
        creatorUrl:
          type: string
          nullable: true
        creatorImage:
          type: string
          nullable: true
        createdAt:
          type: string
          format: date-time
          nullable: true
        updatedAt:
          type: string
          format: date-time
          nullable: true
    Series:
      type: object
      properties:
        id:
          type: string
        ticker:
          type: string
          nullable: true
        slug:
          type: string
          nullable: true
        title:
          type: string
          nullable: true
        subtitle:
          type: string
          nullable: true
        seriesType:
          type: string
          nullable: true
        recurrence:
          type: string
          nullable: true
        description:
          type: string
          nullable: true
        image:
          type: string
          nullable: true
        icon:
          type: string
          nullable: true
        layout:
          type: string
          nullable: true
        active:
          type: boolean
          nullable: true
        closed:
          type: boolean
          nullable: true
        archived:
          type: boolean
          nullable: true
        new:
          type: boolean
          nullable: true
        featured:
          type: boolean
          nullable: true
        restricted:
          type: boolean
          nullable: true
        isTemplate:
          type: boolean
          nullable: true
        templateVariables:
          type: boolean
          nullable: true
        publishedAt:
          type: string
          nullable: true
        createdBy:
          type: string
          nullable: true
        updatedBy:
          type: string
          nullable: true
        createdAt:
          type: string
          format: date-time
          nullable: true
        updatedAt:
          type: string
          format: date-time
          nullable: true
        commentsEnabled:
          type: boolean
          nullable: true
        competitive:
          type: string
          nullable: true
        volume24hr:
          type: number
          nullable: true
        volume:
          type: number
          nullable: true
        liquidity:
          type: number
          nullable: true
        startDate:
          type: string
          format: date-time
          nullable: true
        pythTokenID:
          type: string
          nullable: true
        cgAssetName:
          type: string
          nullable: true
        score:
          type: integer
          nullable: true
        events:
          type: array
          items:
            $ref: '#/components/schemas/Event'
        collections:
          type: array
          items:
            $ref: '#/components/schemas/Collection'
        categories:
          type: array
          items:
            $ref: '#/components/schemas/Category'
        tags:
          type: array
          items:
            $ref: '#/components/schemas/Tag'
        commentCount:
          type: integer
          nullable: true
        chats:
          type: array
          items:
            $ref: '#/components/schemas/Chat'
    Collection:
      type: object
      properties:
        id:
          type: string
        ticker:
          type: string
          nullable: true
        slug:
          type: string
          nullable: true
        title:
          type: string
          nullable: true
        subtitle:
          type: string
          nullable: true
        collectionType:
          type: string
          nullable: true
        description:
          type: string
          nullable: true
        tags:
          type: string
          nullable: true
        image:
          type: string
          nullable: true
        icon:
          type: string
          nullable: true
        headerImage:
          type: string
          nullable: true
        layout:
          type: string
          nullable: true
        active:
          type: boolean
          nullable: true
        closed:
          type: boolean
          nullable: true
        archived:
          type: boolean
          nullable: true
        new:
          type: boolean
          nullable: true
        featured:
          type: boolean
          nullable: true
        restricted:
          type: boolean
          nullable: true
        isTemplate:
          type: boolean
          nullable: true
        templateVariables:
          type: string
          nullable: true
        publishedAt:
          type: string
          nullable: true
        createdBy:
          type: string
          nullable: true
        updatedBy:
          type: string
          nullable: true
        createdAt:
          type: string
          format: date-time
          nullable: true
        updatedAt:
          type: string
          format: date-time
          nullable: true
        commentsEnabled:
          type: boolean
          nullable: true
        imageOptimized:
          $ref: '#/components/schemas/ImageOptimization'
        iconOptimized:
          $ref: '#/components/schemas/ImageOptimization'
        headerImageOptimized:
          $ref: '#/components/schemas/ImageOptimization'
    Chat:
      type: object
      properties:
        id:
          type: string
        channelId:
          type: string
          nullable: true
        channelName:
          type: string
          nullable: true
        channelImage:
          type: string
          nullable: true
        live:
          type: boolean
          nullable: true
        startTime:
          type: string
          format: date-time
          nullable: true
        endTime:
          type: string
          format: date-time
          nullable: true
    Template:
      type: object
      properties:
        id:
          type: string
        eventTitle:
          type: string
          nullable: true
        eventSlug:
          type: string
          nullable: true
        eventImage:
          type: string
          nullable: true
        marketTitle:
          type: string
          nullable: true
        description:
          type: string
          nullable: true
        resolutionSource:
          type: string
          nullable: true
        negRisk:
          type: boolean
          nullable: true
        sortBy:
          type: string
          nullable: true
        showMarketImages:
          type: boolean
          nullable: true
        seriesSlug:
          type: string
          nullable: true
        outcomes:
          type: string
          nullable: true

````