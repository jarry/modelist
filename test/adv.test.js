const Modelist = require('../dist/index.min')
const Model = Modelist.Model
const List = Modelist.List

/**
 * 安装node 和 jest，执行命令测试
 * $ jest test/adv.test.js 
 */

/** 复杂业务结构测试  */

// 源数据
const albumData = {
    "orderType": 1,
    "twCatalogStatus": 2,
    "pursuit": 0,
    "contentRank": 0,
    "defImgStatus": 1,
    "catalogUserName": "我是木木mu",
    "qipuId": 221854201,
    "albumType": 1,
    "season": 0,
    "id": 108961089,
    "defImg": "http://pic1.qiyipic.com/image/20180204/f4/70/a_100126218_m_601_m1.jpg",
    "contentType": 1,
    "phase": 0,
    "awardEntities": "{\"awardAll\":[{\"id\":114,\"name\":\"MTV电影奖\"},{\"id\":115,\"name\":\"上海国际电影节\"},{\"id\":116,\"name\":\"东京国际电影节\"},{\"id\":119,\"name\":\"亚洲电影大奖\"},{\"id\":120,\"name\":\"人民选择奖\"},{\"id\":121,\"name\":\"北京国际电影节\"},{\"id\":122,\"name\":\"华语电影传媒大奖\"},{\"id\":124,\"name\":\"土星奖\"},{\"id\":125,\"name\":\"圣丹斯国际电影节\"},{\"id\":126,\"name\":\"多伦多国际电影节\"},{\"id\":127,\"name\":\"大众电影百花奖\"},{\"id\":128,\"name\":\"奥斯卡金像奖\"},{\"id\":129,\"name\":\"威尼斯国际电影节\"},{\"id\":130,\"name\":\"安妮奖\"},{\"id\":132,\"name\":\"意大利电影大卫奖\"},{\"id\":133,\"name\":\"戛纳国际电影节\"},{\"id\":134,\"name\":\"日本电影学院奖\"},{\"id\":135,\"name\":\"柏林国际电影节\"},{\"id\":136,\"name\":\"欧洲电影奖\"},{\"id\":138,\"name\":\"洛迦诺国际电影节\"},{\"id\":139,\"name\":\"美国金球奖\"},{\"id\":140,\"name\":\"艾美奖\"},{\"id\":141,\"name\":\"英国电影和电视艺术学院奖\"},{\"id\":142,\"name\":\"西班牙戈雅奖\"},{\"id\":143,\"name\":\"釜山国际电影节\"},{\"id\":144,\"name\":\"青少年选择奖\"},{\"id\":145,\"name\":\"韩国电影大钟奖\"},{\"id\":146,\"name\":\"韩国电影青龙奖\"},{\"id\":153,\"name\":\"法国凯撒奖\"},{\"id\":154,\"name\":\"中国电影金鸡奖\"},{\"id\":155,\"name\":\"台湾电影金马奖\"},{\"id\":156,\"name\":\"德国电影奖\"},{\"id\":157,\"name\":\"韩国百想艺术大赏\"},{\"id\":158,\"name\":\"香港电影金像奖\"},{\"id\":159,\"name\":\"圣塞巴斯蒂安国际电影节\"},{\"id\":160,\"name\":\"长春国际电影节\"},{\"id\":161,\"name\":\"印度国际电影节\"},{\"id\":162,\"name\":\"开罗国际电影节\"},{\"id\":163,\"name\":\"蒙特利尔国际电影节\"}],\"awards\":[]}",
    "entityType": 1,
    "updateTime": "2018-02-04 08:09:18",
    "entityId": 100126218,
    "titles": [{
        "createTime": "2018-02-03 09:19:50",
        "metaId": 108961089,
        "displayName": "【木木】超级怪物卡车汽车挖掘机类游戏",
        "properTitle": "【木木】超级怪物卡车汽车挖掘机类游戏",
        "updateTime": "2018-02-04 08:08:57",
        "language": "zh",
        "id": 112184466,
        "version": 1
    }, {
        "createTime": "2018-02-03 09:19:50",
        "metaId": 108961089,
        "displayName": "【木木】超級怪物卡車汽車挖掘機類遊戲",
        "properTitle": "【木木】超級怪物卡車汽車挖掘機類遊戲",
        "updateTime": "2018-02-03 09:19:50",
        "language": "zh_TW",
        "id": 112184467,
        "version": 0
    }],
    "version": 3,
    "catalogStatus": 1,
    "totalNumberOfEpisodes": 0,
    "site": "SITE_ZH",
    "isOuterUser": false,
    "safeStatus": 0,
    "peopleRoleEntities": "[]",
    "createTime": "2018-02-03 09:19:50",
    "globalPublishDate": "20180203",
    "partnerId": "9969",
    "catalogUser": 1446840285,
    "businessType": 0,
    "auditPublishType": 1,
    "categoryId": 8,
    "first": {
        "second": {
            "third": '层级value'
        }
    }
}

const albumFormatter = {
    // 1. 直接替换内容
    random: Math.round(Math.random() * 2000),
    author: 'Thomas',
    // 2. 函数回调替换
    orderType: (source) => {
        return source.orderType
    },
    catalogStatus: (source) => {
        return source.catalogStatus
    },
    // 函数支持三个参数，分别是来源，模型，格式器
    channel: (source, model, formatter) => {
        return source.categoryId
    },
    catalogUser: (source, model, formatter) => {
        return '作者名' + source.order
    },
    title: (source, model, formatter) => {
        let titles = new List(source.titles)
        titles.removeBy((model, idx) => {
            return model.language != 'zh'
        })
        titles.forEach((model, idx) => {
            model.removeKey('metaId', 'version', 'updateTime')
        })
        return titles
    },
    awardEntities: (source, model, formatter) => {
        if (typeof source['awardEntities'] == 'string') {
            let awardJSON = JSON.parse(source['awardEntities'])
            let awardAll = new List(awardJSON.awardAll)
            return awardAll.groupBy('id')
        } else {
            console.warn('is not string:', source)
        }
    },
    // 3. 根据key查找内容
    category: ['categoryId'],
    // 层级快选示例
    childValue: ['first', 'second', 'third'],
    // 如果是数组则可以传递数字
    updateTime: ['titles', 1, 'updateTime'],
    first: ['first', 'second', 'third']
}

// 创建Model类
class Album extends Model {
    constructor(source, formatter) {
        super()
        // 定义模型属性
        this.define({
            order: -1,
            random: 0,
            channel: undefined,
            title: '',
            orderType: 0,
            catalogUser: undefined,
            awardEntities: undefined,
            category: -1,
            author: ''
        })

        // 定义格式化器，这个格式器也可以定义在Model里
        // 也可以全部由外部传入，或者是内部与外部的组合
        // formatter = Object.assign({}, formatter)

        // 初始化Model，需要传入source与formatter
        // source是源数据，formatter格式器将源数据的值加工处理再赋值给Model的属性
        this.init(source, {...albumFormatter, ...formatter})
    }

    // 若覆盖了preprocess方法，即对源数据进行了干预，意思是在format之前把源数据调整为适合format的状态
    // 在preprocess里修改了source之后，Model里面的getSource()会受到影响，也就是最初的源变化了
    // 如果返回是非false，则在之后自动执行format，如果false表示源数据处理后暂停，不自动format数据
    preprocess(source, formatter) {
        source.orderType = 111
        return this
    }
}

// 实例化测试
test('业务Model测试', () => {
    let albumModel = new Album(albumData)
    expect(albumModel.toJSON().catalogStatus).toBe(1)
    expect(albumModel.get('author')).toBe('Thomas')
    expect(albumModel.title.length).toBe(1)
    expect(albumModel.title[0].getKeys()).toEqual(["createTime", "displayName", "properTitle", "language", "id"])
    expect(albumModel.first).toBe('层级value')
})

test('List包含业务Model测试', () => {
    // 如果Album是多份数据，则可以借用List来完成集合操作
    let sourceData = []
    for (var i = 0; i < 5; i++) {
        let tmpData = {...albumData, order: i}
        sourceData.push(tmpData)
    }
    let albumList = new List(sourceData, Album)
    
    expect(albumList.length).toBe(5)
    expect(albumList.sortBy('order', 'desc').get(1).get('order')).toBe(3)
    expect(albumList.indexOfBy((m) => {
        console.log(m.catalogUser, m.random, m.order)
        return m.order === 2
    })).toBe(2)
    expect(albumList.get(1).first).toBe('层级value')
    expect(albumList.uniqueBy((one, two) => {
        if (Math.abs(one.order - two.order) === 3) {
            return true
        }
    }).length).toBe(3)
    expect(albumList.countBy((model, idx) => {
        return model.order > 2
    })).toBe(2)
    // console.log('albumList after change:', albumList)
})
